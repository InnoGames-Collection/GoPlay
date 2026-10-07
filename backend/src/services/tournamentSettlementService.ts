import { getClient, query, pool } from '../config/database.js';
import { telebirrService } from './telebirrService.js';
import { cache } from '../config/cache.js';
import { auditLogService } from './auditLogService.js';

export interface PrizeDistributionTier {
  rank: number;
  prizeETB: number;
  prizeCoins: number;
}

const DEFAULT_PRIZE_TIERS: PrizeDistributionTier[] = [
  { rank: 1, prizeETB: 10000, prizeCoins: 500 },
  { rank: 2, prizeETB: 6000, prizeCoins: 300 },
  { rank: 3, prizeETB: 3000, prizeCoins: 200 },
  { rank: 4, prizeETB: 1000, prizeCoins: 100 },
  { rank: 5, prizeETB: 1000, prizeCoins: 100 },
  { rank: 6, prizeETB: 800, prizeCoins: 50 },
  { rank: 7, prizeETB: 800, prizeCoins: 50 },
  { rank: 8, prizeETB: 800, prizeCoins: 50 },
  { rank: 9, prizeETB: 800, prizeCoins: 50 },
  { rank: 10, prizeETB: 800, prizeCoins: 50 },
];

export const tournamentSettlementService = {
  /**
   * Enter tournament with atomic coin deduction and deterministic idempotency
   */
  async enterTournament(
    userId: string,
    tournamentId: string,
    roundAttempt: number = 1
  ): Promise<{ success: boolean; message: string; remainingCoins?: number; attemptsLeft?: number }> {
    // Verify player is not banned
    const playerCheck = await query(`SELECT is_banned, ban_reason FROM profiles WHERE id = $1`, [userId]);
    if (playerCheck.rows[0]?.is_banned) {
      return {
        success: false,
        message: `Account is banned from tournament play: ${playerCheck.rows[0].ban_reason || 'Policy violation'}.`,
      };
    }

    // Deterministic idempotency key: one deduction per tournament attempt round
    const idempotencyKey = `TOURN_ENTRY_${tournamentId}_${userId}_R${roundAttempt}`;

    const res = await query(
      `SELECT success, new_balance, attempts_left, message 
         FROM deduct_tournament_fee_v2($1, $2, $3)`,
      [userId, tournamentId, idempotencyKey]
    );

    const row = res.rows[0];
    if (!row || !row.success) {
      return { success: false, message: row?.message || 'Failed to enter tournament. Check coin balance.' };
    }

    return {
      success: true,
      message: 'Tournament entry confirmed.',
      remainingCoins: parseInt(row.new_balance, 10),
      attemptsLeft: row.attempts_left,
    };
  },

  /**
   * Fetch live authoritative tournament leaderboard from PostgreSQL
   */
  async getLeaderboard(tournamentId: string, limit: number = 10) {
    const res = await query(
      `SELECT 
         ROW_NUMBER() OVER(ORDER BY te.score DESC, te.submitted_at ASC) as rank,
         te.masked_msisdn,
         COALESCE(p.display_name, 'Player') as display_name,
         te.score,
         te.submitted_at,
         te.attempts_count
       FROM tournament_entries te
       LEFT JOIN profiles p ON te.user_id = p.id
      WHERE te.tournament_id = $1
      ORDER BY te.score DESC, te.submitted_at ASC
      LIMIT $2`,
      [tournamentId, limit]
    );

    return res.rows.map((r: any, idx: number) => {
      const tier = DEFAULT_PRIZE_TIERS[idx];
      return {
        rank: parseInt(r.rank, 10),
        maskedMsisdn: r.masked_msisdn,
        displayName: r.display_name,
        score: parseInt(r.score, 10),
        prizeETB: tier ? tier.prizeETB : 0,
        prizeText: tier ? `${tier.prizeETB.toLocaleString()} ETB + ${tier.prizeCoins} Coins` : '',
        submittedAt: r.submitted_at,
      };
    });
  },

  /**
   * Authoritative Finalization & Payout for a Specific Tournament
   * Enforces Distributed Lock (Redis SETNX) + PostgreSQL Advisory Lock + Two-Phase Settlement
   */
  async finalizeTournament(
    tournamentId: string,
    adminId: string = 'SYSTEM_CRON',
    adminUsername: string = 'SYSTEM'
  ): Promise<{ success: boolean; message: string; disbursementsCount: number; contenders: any[] }> {
    const lockKey = `lock:tournament:finalize:${tournamentId}`;
    let lockAcquired = false;

    try {
      const lockRes = await cache.set(lockKey, 'locked', 'EX', 180, 'NX');
      lockAcquired = lockRes === 'OK';
    } catch {
      // In standalone dev without cache, proceed to relational lock
      lockAcquired = true;
    }

    if (!lockAcquired) {
      return {
        success: false,
        message: 'Concurrency conflict: Tournament payout already being processed on another worker.',
        disbursementsCount: 0,
        contenders: [],
      };
    }

    const client = await getClient();
    let contenders: any[] = [];
    let tourTitle = '';
    let disbursementsCount = 0;

    try {
      // Phase 1: Relational State Transition & Intent Recording under Transaction
      await client.query('BEGIN');

      // 1. PostgreSQL Transaction Advisory Lock (Defense-in-depth lock)
      const advLockRes = await client.query(
        `SELECT pg_try_advisory_xact_lock(hashtext($1)) as acquired`,
        [`tourn_finalize_${tournamentId}`]
      );
      if (!advLockRes.rows[0]?.acquired) {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'PostgreSQL advisory transaction lock rejected: tournament is locked.',
          disbursementsCount: 0,
          contenders: [],
        };
      }

      // 2. Row Lock & State Validation
      const tourRes = await client.query(
        `SELECT id, title, prize_pool_etb, status 
           FROM tournaments 
          WHERE id = $1 
            FOR UPDATE`,
        [tournamentId]
      );

      if (tourRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Tournament not found.', disbursementsCount: 0, contenders: [] };
      }

      const tour = tourRes.rows[0];
      tourTitle = tour.title;

      if (tour.status === 'FINALIZED') {
        await client.query('ROLLBACK');
        return {
          success: false,
          message: 'Tournament is already finalized and settled.',
          disbursementsCount: 0,
          contenders: [],
        };
      }

      // 3. Mark Tournament Finalized
      await client.query(`UPDATE tournaments SET status = 'FINALIZED' WHERE id = $1`, [tournamentId]);

      // 4. Fetch Contenders
      const entriesRes = await client.query(
        `SELECT te.user_id, te.player_msisdn, te.score, p.phone, p.display_name
           FROM tournament_entries te
           JOIN profiles p ON te.user_id = p.id
          WHERE te.tournament_id = $1
          ORDER BY te.score DESC, te.submitted_at ASC
          LIMIT 10`,
        [tournamentId]
      );

      contenders = entriesRes.rows;

      // 5. Pre-insert PENDING Intent Rows in tournament_payouts table
      for (let i = 0; i < contenders.length; i++) {
        const contender = contenders[i];
        const rank = i + 1;
        const tier = DEFAULT_PRIZE_TIERS.find((t) => t.rank === rank) || { rank, prizeETB: 0, prizeCoins: 0 };
        const idempotencyKey = `PAYOUT_${tournamentId}_RANK_${rank}_${contender.user_id}`;

        await client.query(
          `INSERT INTO tournament_payouts (
             tournament_id, user_id, msisdn, rank, prize_etb, prize_coins, status, idempotency_key
           ) VALUES ($1, $2, $3, $4, $5, $6, 'PROCESSING', $7)
           ON CONFLICT (idempotency_key) DO NOTHING`,
          [tournamentId, contender.user_id, contender.phone, rank, tier.prizeETB, tier.prizeCoins, idempotencyKey]
        );
      }

      await client.query('COMMIT');
    } catch (phase1Err: any) {
      await client.query('ROLLBACK');
      console.error('[Tournament Finalize Phase 1 Error]', phase1Err);
      return {
        success: false,
        message: `Database error during finalization intent: ${phase1Err.message}`,
        disbursementsCount: 0,
        contenders: [],
      };
    } finally {
      client.release();
    }

    // Phase 2: Execute External Telebirr B2C Disbursements Out-of-Band
    for (let i = 0; i < contenders.length; i++) {
      const contender = contenders[i];
      const rank = i + 1;
      const tier = DEFAULT_PRIZE_TIERS.find((t) => t.rank === rank) || { rank, prizeETB: 0, prizeCoins: 0 };
      const idempotencyKey = `PAYOUT_${tournamentId}_RANK_${rank}_${contender.user_id}`;

      const payoutCheck = await pool.query(
        `SELECT id, status FROM tournament_payouts WHERE idempotency_key = $1`,
        [idempotencyKey]
      );

      if (!payoutCheck.rows[0] || payoutCheck.rows[0].status !== 'PROCESSING') {
        continue;
      }

      const payoutId = payoutCheck.rows[0].id;

      // Execute Telebirr B2C External Disbursal
      const b2cResult = await telebirrService.disburseReward(
        contender.phone,
        tier.prizeETB,
        idempotencyKey
      );

      if (b2cResult.success) {
        await pool.query(
          `UPDATE tournament_payouts 
              SET status = 'DISBURSED', telebirr_b2c_ref = $1, settled_at = NOW() 
            WHERE id = $2`,
          [b2cResult.ref || 'TB_DISBURSED', payoutId]
        );

        if (tier.prizeCoins > 0) {
          await pool.query(
            `SELECT credit_player_coins_v2($1, $2, $3, $4, $5)`,
            [
              contender.user_id,
              tier.prizeCoins,
              `Tournament Rank #${rank} Prize`,
              tournamentId,
              `COIN_PRIZE_${tournamentId}_${contender.user_id}`,
            ]
          );
        }
        disbursementsCount++;
      } else {
        await pool.query(
          `UPDATE tournament_payouts 
              SET status = 'FAILED', error_message = $1 
            WHERE id = $2`,
          [b2cResult.error || 'B2C Gateway Failure', payoutId]
        );
      }
    }

    // Record Immutable Compliance Audit Trail
    try {
      await auditLogService.record({
        adminId,
        adminUsername,
        action: 'TOURNAMENT_FINALIZATION_AND_PAYOUT',
        entityType: 'tournament',
        entityId: tournamentId,
        oldValue: { status: 'ACTIVE', title: tourTitle },
        newValue: { status: 'FINALIZED', contendersPaid: disbursementsCount, totalContenders: contenders.length },
      });
    } catch (auditErr) {
      console.warn('[Audit Warning] Could not record tournament finalization audit entry:', auditErr);
    }

    // Release Redis Distributed Lock
    try {
      await cache.del(lockKey);
    } catch {}

    return {
      success: true,
      message: `Tournament successfully finalized. ${disbursementsCount} of ${contenders.length} prize payouts disbursed via Telebirr.`,
      disbursementsCount,
      contenders,
    };
  },

  /**
   * Authoritative Cron: Process Expired Active Tournaments
   */
  async executeScheduledSettlement(): Promise<{ settledTournaments: string[]; disbursementsCount: number }> {
    const expiredRes = await query(
      `SELECT id FROM tournaments WHERE status = 'ACTIVE' AND end_date <= NOW()`
    );

    const settledTournaments: string[] = [];
    let totalDisbursements = 0;

    for (const row of expiredRes.rows) {
      const res = await this.finalizeTournament(row.id, 'SYSTEM_CRON', 'SYSTEM');
      if (res.success) {
        settledTournaments.push(row.id);
        totalDisbursements += res.disbursementsCount;
      }
    }

    return { settledTournaments, disbursementsCount: totalDisbursements };
  },
};
