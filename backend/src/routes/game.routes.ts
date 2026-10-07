import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { GameAntiCheat } from '../services/gameAntiCheat.js';
import { requireAuth } from '../middleware/auth.js';

const SessionStartSchema = z.object({
  gameId: z.string().min(1),
  tournamentId: z.string().optional(),
});

const SessionSubmitSchema = z.object({
  sessionId: z.string().min(1),
  token: z.string().min(1),
  gameId: z.string().min(1),
  score: z.number().int().nonnegative().optional(),
  rawScore: z.number().int().nonnegative().optional(),
  tournamentId: z.string().optional(),
  telemetry: z.object({
    inputsCount: z.number().optional(),
    fpsAverage: z.number().optional(),
    checksum: z.string().optional(),
    levelReached: z.number().optional(),
  }).optional(),
});

export async function gameRoutes(fastify: FastifyInstance) {
  // Public: 12-Game Catalog directly from PostgreSQL games table
  fastify.get('/catalog', async () => {
    const res = await pool.query(
      `SELECT game_id, title, category, is_free, requires_coins, entry_fee_coins, is_enabled, max_score, max_score_per_sec, min_duration_sec
         FROM games
        WHERE is_enabled = TRUE
        ORDER BY (game_id = 'crazy-colors') DESC, title ASC`
    );
    return {
      success: true,
      games: res.rows.map((r: any) => ({
        gameId: r.game_id,
        title: r.title,
        category: r.category,
        isFree: r.is_free,
        requiresCoins: r.requires_coins,
        coinCost: parseInt(r.entry_fee_coins ?? (r.requires_coins ? 2 : 0), 10),
        maxScore: r.max_score,
        maxScorePerSec: r.max_score_per_sec,
        minDurationSec: parseFloat(r.min_duration_sec ?? 3.0),
      })),
    };
  });

  // Game Specific All-Time Leaderboard from PostgreSQL high_scores
  fastify.get('/leaderboard/:gameId', async (req, reply) => {
    const { gameId } = req.params as { gameId: string };
    const res = await pool.query(
      `SELECT 
         ROW_NUMBER() OVER(ORDER BY hs.best_score DESC, hs.updated_at ASC) as rank,
         COALESCE(p.display_name, 'Player') as display_name,
         p.phone,
         hs.best_score,
         hs.updated_at
       FROM high_scores hs
       JOIN profiles p ON hs.user_id = p.id
      WHERE hs.game_id = $1
      ORDER BY hs.best_score DESC, hs.updated_at ASC
      LIMIT 10`,
      [gameId]
    );

    return reply.send({
      gameId,
      entries: res.rows.map((r: any) => ({
        rank: parseInt(r.rank, 10),
        displayName: r.display_name,
        playerMasked: r.phone ? (r.phone.substring(0, 3) + '*****' + r.phone.slice(-3)) : '091*****989',
        score: parseInt(r.best_score, 10),
        timestamp: r.updated_at,
      })),
    });
  });

  // Start Authoritative Game Run Session (Authenticated)
  fastify.post('/session/start', { preHandler: [requireAuth] }, async (req, reply) => {
    const parseResult = SessionStartSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
    }

    const userId = req.user!.userId;
    const phone = req.user!.phone;
    const { gameId, tournamentId } = parseResult.data;

    const result = await GameAntiCheat.startAuthoritativeSession({
      userId,
      msisdn: phone,
      gameId,
      tournamentId,
    });

    if (!result.success) {
      return reply.status(400).send({ success: false, message: result.message });
    }

    return reply.send({
      success: true,
      sessionId: result.sessionId,
      sessionToken: result.sessionToken,
      token: result.sessionToken,
    });
  });

  // Submit Authoritative Game Score (Authenticated)
  fastify.post('/session/submit', { preHandler: [requireAuth] }, async (req, reply) => {
    const parseResult = SessionSubmitSchema.safeParse(req.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.format(),
      });
    }

    const userId = req.user!.userId;
    const { sessionId, token, score, rawScore, gameId, tournamentId, telemetry } = parseResult.data;

    const finalScore = score !== undefined ? score : (rawScore !== undefined ? rawScore : 0);

    const check = await GameAntiCheat.verifyAndRecordScore(userId, {
      sessionId,
      token,
      gameId,
      tournamentId,
      score: finalScore,
      telemetry,
    });

    return reply.send({
      success: check.success,
      verified: check.verified,
      score: check.score,
      rank: check.rank,
      reason: check.reason,
    });
  });
}
