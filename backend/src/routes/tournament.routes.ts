import { FastifyInstance } from 'fastify';
import { pool } from '../config/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { tournamentSettlementService } from '../services/tournamentSettlementService.js';

export async function tournamentRoutes(fastify: FastifyInstance) {
  // Get active tournaments with live database leaderboard
  const getTournamentsHandler = async () => {
    const tournsRes = await pool.query(
      `SELECT t.*, g.title as game_title, g.category as game_category
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
