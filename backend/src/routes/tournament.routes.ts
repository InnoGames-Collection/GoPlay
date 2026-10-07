import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { tournamentSettlementService } from '../services/tournamentSettlementService.js';

export async function tournamentRoutes(fastify: FastifyInstance) {
  // Get active tournaments with live database leaderboard
  const getTournamentsHandler = async () => {
    const tournsRes = await pool.query(
      `SELECT t.*, g.title as game_title, g.category as game_category,
              COALESCE(t.tournament_type, 'STANDARD') as tournament_type,
              (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) as participants_count
       FROM tournaments t
       JOIN games g ON t.game_id = g.game_id
       WHERE t.status = 'ACTIVE'
       ORDER BY t.start_date DESC`
    );

    const tournaments = [];
    for (const tourn of tournsRes.rows) {
      const leaderboard = await tournamentSettlementService.getLeaderboard(tourn.id, 10);
      tournaments.push({
        ...tourn,
        participantsCount: parseInt(tourn.participants_count || '0', 10),
        leaderboard,
      });
    }

    return tournaments;
  };

  fastify.get('/', async () => {
    return await getTournamentsHandler();
  });

  fastify.get('/active', async () => {
    const tournaments = await getTournamentsHandler();
    return { tournaments };
  });

  // Check user daily challenge attempt status
  fastify.get('/daily-status', { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user!.userId;
    const dailyTournRes = await pool.query(
      `SELECT id, title, game_id, prize_pool_etb, start_date, end_date
       FROM tournaments
       WHERE status = 'ACTIVE' AND tournament_type = 'DAILY'
       LIMIT 1`
    );

    if (dailyTournRes.rowCount === 0) {
      return reply.send({
        hasActiveDaily: false,
        hasAttemptedToday: false,
        activeTournament: null,
      });
    }

    const tourn = dailyTournRes.rows[0];
    const attemptRes = await pool.query(
      `SELECT id, score, created_at
       FROM daily_challenge_attempts
       WHERE user_id = $1 AND attempt_date = CURRENT_DATE
       LIMIT 1`,
      [userId]
    );

    const hasAttempted = attemptRes.rowCount! > 0;
    return reply.send({
      hasActiveDaily: true,
      hasAttemptedToday: hasAttempted,
      attempt: hasAttempted ? attemptRes.rows[0] : null,
      activeTournament: tourn,
    });
  });

  // Get live tournament leaderboard
  fastify.get('/:id/leaderboard', async (req, reply) => {
    const { id } = req.params as { id: string };
    const leaderboard = await tournamentSettlementService.getLeaderboard(id, 20);
    return reply.send({ tournamentId: id, leaderboard });
  });

  // Enter tournament (2 coins atomic deduction in PostgreSQL)
  fastify.post('/:id/enter', { preHandler: [requireAuth] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const userId = req.user!.userId;
    const body = (req.body || {}) as { roundAttempt?: number };

    // Check if tournament is DAILY and already attempted
    const tourRes = await pool.query(
      `SELECT tournament_type FROM tournaments WHERE id = $1`,
      [id]
    );
    if (tourRes.rows[0]?.tournament_type === 'DAILY') {
      const attemptRes = await pool.query(
        `SELECT id FROM daily_challenge_attempts WHERE user_id = $1 AND attempt_date = CURRENT_DATE`,
        [userId]
      );
      if (attemptRes.rowCount! > 0) {
        return reply.status(403).send({
          success: false,
          message: 'Daily challenge is strictly once per day. You have already completed today\'s challenge.',
        });
      }
    }

    const result = await tournamentSettlementService.enterTournament(userId, id, body.roundAttempt || 1);
    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.send(result);
  });

  // Admin or Cron: Trigger Tournament Settlement & Real Payouts
  fastify.post('/settle', { preHandler: [requireAdmin] }, async (req, reply) => {
    const result = await tournamentSettlementService.executeScheduledSettlement();
    return reply.send({ success: true, ...result });
  });
}
