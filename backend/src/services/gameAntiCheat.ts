import crypto from 'crypto';
import { getClient, query } from '../config/database.js';
import { signGameRoundToken, verifyGameRoundToken } from '../utils/jwt.js';

export function normalizeMsisdn(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('251')) return digits;
  if (digits.startsWith('09')) return '251' + digits.substring(1);
  if (digits.startsWith('9')) return '251' + digits;
  if (digits.startsWith('07')) return '251' + digits.substring(1);
  if (digits.startsWith('7')) return '251' + digits;
  return digits;
}

export function maskMsisdn(msisdn: string): string {
  const norm = normalizeMsisdn(msisdn);
  if (norm.length >= 9) {
    const prefix = norm.startsWith('251') ? '0' + norm.substring(3, 5) : norm.substring(0, 3);
    const suffix = norm.slice(-3);
    return `${prefix}*****${suffix}`;
  }
  return '091*****989';
}

export interface ScoreSubmissionPacket {
  sessionId: string;
  token: string;
  gameId: string;
  tournamentId?: string;
  score: number;
  durationSeconds?: number;
  telemetry?: {
    inputsCount?: number;
    fpsAverage?: number;
    checksum?: string;
    levelReached?: number;
  };
}

export const GameAntiCheat = {
  /**
   * Start game run session: Issues signed JWT token at match start
   */
  async startAuthoritativeSession(params: {
    userId: string;
    msisdn: string;
    gameId: string;
    tournamentId?: string;
  }): Promise<{ success: boolean; sessionId: string; sessionToken: string; message?: string }> {
    const { userId, msisdn, gameId, tournamentId } = params;

    // Verify player is not banned
    const playerCheck = await query(`SELECT is_banned, ban_reason FROM profiles WHERE id = $1`, [userId]);
    if (playerCheck.rows[0]?.is_banned) {
      return {
        success: false,
        sessionId: '',
        sessionToken: '',
        message: `Account is banned: ${playerCheck.rows[0].ban_reason || 'Administrative policy violation'}.`,
      };
    }

    // Verify game state from PostgreSQL
    const gameRes = await query(
      `SELECT game_id, is_enabled, requires_coins, max_score, max_score_per_sec, min_duration_sec 
         FROM games 
        WHERE game_id = $1`,
      [gameId]
    );

    if (gameRes.rowCount === 0 || !gameRes.rows[0].is_enabled) {
      return { success: false, sessionId: '', sessionToken: '', message: 'Game unavailable or disabled' };
    }

    if (tournamentId) {
      const tourRes = await query(
        `SELECT id, status FROM tournaments WHERE id = $1 AND status = 'ACTIVE' AND end_date > NOW()`,
        [tournamentId]
      );
      if (tourRes.rowCount === 0) {
        return { success: false, sessionId: '', sessionToken: '', message: 'Tournament expired or inactive' };
      }
    }

    const sessionId = `GSS_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const sessionToken = signGameRoundToken({
      uid: userId,
      gid: gameId,
      tid: tournamentId,
      jti: sessionId,
    });

    const normPhone = normalizeMsisdn(msisdn);

    // Write initial session to DB
    await query(
      `INSERT INTO game_sessions (
         session_id, player_msisdn, game_id, session_token, started_at, user_id, tournament_id, is_finalized
       ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, FALSE)`,
      [sessionId, normPhone, gameId, sessionToken, userId, tournamentId || null]
    );

    return { success: true, sessionId, sessionToken };
  },

  /**
   * Authoritatively verify score packet, enforce duration, and record leaderboard placement.
   */
  async verifyAndRecordScore(
    userId: string,
    packet: ScoreSubmissionPacket
  ): Promise<{ success: boolean; verified: boolean; score: number; rank?: number; reason?: string }> {
    const { sessionId, token, gameId, score, tournamentId, telemetry } = packet;

    // 1. Cryptographic Round Token Check
    const decoded = verifyGameRoundToken(token);
    if (!decoded || decoded.jti !== sessionId || decoded.uid !== userId || decoded.gid !== gameId) {
      return { success: false, verified: false, score: 0, reason: 'Forged or invalid game token' };
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // 2. Lock session row (Single-Use Guarantee)
      const sessRes = await client.query(
        `SELECT session_id, started_at, is_finalized, player_msisdn 
           FROM game_sessions 
          WHERE session_id = $1 AND user_id = $2 
            FOR UPDATE`,
        [sessionId, userId]
      );

      if (sessRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, verified: false, score: 0, reason: 'Game session not found' };
      }

      const session = sessRes.rows[0];
      if (session.is_finalized) {
        await client.query('ROLLBACK');
        return { success: false, verified: false, score: 0, reason: 'Replay blocked: Session already submitted' };
      }

      // 3. Compute Server Duration (Source of Truth)
      const startedAt = new Date(session.started_at).getTime();
      const serverDurationSec = Math.max(0.1, (Date.now() - startedAt) / 1000);

      // 4. Retrieve Game Thresholds
      const gameRes = await client.query(
        `SELECT max_score, max_score_per_sec, min_duration_sec FROM games WHERE game_id = $1`,
        [gameId]
      );
      const thresholds = gameRes.rows[0] || { max_score: 100000, max_score_per_sec: 100, min_duration_sec: 3.0 };

      // 5. Anti-Cheat Integrity Verification
      let isFraud = false;
      let rejectReason: string | undefined;

      // Hard Ceiling Check
      if (score > thresholds.max_score) {
        isFraud = true;
        rejectReason = `Score ${score} exceeds limit of ${thresholds.max_score}`;
      }

      // Minimum Duration Check
      if (score > 100 && serverDurationSec < Number(thresholds.min_duration_sec)) {
        isFraud = true;
        rejectReason = `Duration too brief: ${score} pts in only ${serverDurationSec.toFixed(1)}s`;
      }

      // Score Velocity Check
      const velocity = score / serverDurationSec;
      if (velocity > thresholds.max_score_per_sec * 1.5) {
        isFraud = true;
        rejectReason = `Velocity exceeded: ${velocity.toFixed(1)} pts/sec`;
      }

      // Telemetry Packet Check
      if (telemetry && telemetry.inputsCount !== undefined && score > 200 && telemetry.inputsCount < 5) {
        isFraud = true;
        rejectReason = 'Telemetry mismatch: Insufficient player inputs';
      }

      // 6. Finalize Session Row
      await client.query(
        `UPDATE game_sessions 
            SET score = $1, completed_at = NOW(), verified = $2, fraud_flag = $3, 
                server_duration_sec = $4, max_velocity = $5, is_finalized = TRUE,
                client_telemetry = $6
          WHERE session_id = $7`,
        [score, !isFraud, isFraud, serverDurationSec, velocity, JSON.stringify(telemetry || {}), sessionId]
      );

      if (isFraud) {
        await client.query('COMMIT');
        return { success: false, verified: false, score, reason: rejectReason };
      }

      // 7. Authoritative High Scores Upsert
      await client.query(
        `INSERT INTO high_scores (user_id, game_id, best_score, updated_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (user_id, game_id) DO UPDATE
           SET best_score = GREATEST(high_scores.best_score, EXCLUDED.best_score),
               updated_at = NOW()`,
        [userId, gameId, score]
      );

      // 8. Tournament Entries Upsert & Live Rank Calculation
      let calculatedRank: number | undefined;

      if (tournamentId) {
        const masked = maskMsisdn(session.player_msisdn);

        await client.query(
          `INSERT INTO tournament_entries (
             tournament_id, player_msisdn, masked_msisdn, score, user_id, submitted_at, attempts_count
           ) VALUES ($1, $2, $3, $4, $5, NOW(), 1)
           ON CONFLICT (tournament_id, user_id) DO UPDATE
             SET score = GREATEST(tournament_entries.score, EXCLUDED.score),
                 submitted_at = NOW()`,
          [tournamentId, session.player_msisdn, masked, score, userId]
        );

        const rankRes = await client.query(
          `SELECT COUNT(*) + 1 AS rank
             FROM tournament_entries
            WHERE tournament_id = $1 AND score > (
              SELECT score FROM tournament_entries WHERE tournament_id = $1 AND user_id = $2
            )`,
          [tournamentId, userId]
        );
        calculatedRank = parseInt(rankRes.rows[0]?.rank || '1', 10);
      }

      await client.query('COMMIT');

      return {
        success: true,
        verified: true,
        score,
        rank: calculatedRank,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Score Submission DB Error]', err);
      return { success: false, verified: false, score: 0, reason: 'Transaction failed' };
    } finally {
      client.release();
    }
  },

  // Backwards compatibility helper for existing test calls
  generateSessionToken(msisdn: string, gameId: string, timestamp: number): string {
    const raw = `${msisdn}:${gameId}:${timestamp}:${process.env.GAME_TOKEN_SECRET || 'secret'}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  },
};
