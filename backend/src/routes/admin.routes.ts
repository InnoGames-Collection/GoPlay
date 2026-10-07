import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { signAdminToken } from '../utils/jwt.js';
import { normalizeEthiopianPhone } from '../utils/msisdn.js';
import { auditLogService } from '../services/auditLogService.js';
import { tournamentSettlementService } from '../services/tournamentSettlementService.js';
import {
  requireAdminAuth,
  requireRole,
  requireSuperAdmin,
  requireTournamentOperator,
  requireFinancialAuditor,
  requireSupportOrAbove,
} from '../middleware/rbac.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // ============================================================================
  // 1. ADMIN AUTHENTICATION (ISOLATED IDENTITY DOMAIN & BRUTE FORCE LOCKOUT)
  // ============================================================================

  const AdminLoginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(6),
  });

  fastify.post('/admin/auth/login', async (request, reply) => {
    const parse = AdminLoginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: 'Invalid request payload',
        details: parse.error.format(),
      });
    }

    const { username, password } = parse.data;
    const ip = request.ip || '127.0.0.1';
    const bruteKey = `bruteforce:admin:${username.toLowerCase()}`;

    // Brute force check: max 5 failed attempts locks for 15 minutes
    try {
      const attempts = await cache.get(bruteKey);
      if (attempts && parseInt(attempts, 10) >= 5) {
        return reply.status(429).send({
          success: false,
          error: 'Security Lockout: Too many failed login attempts. Account locked for 15 minutes.',
          code: 'BRUTE_FORCE_LOCKOUT',
        });
      }
    } catch {
      // Continue if cache offline
    }

    // Query admin_users using PostgreSQL pgcrypto Blowfish/bcrypt verification
    const adminRes = await pool.query(
      `SELECT id, username, email, role, is_active,
              (password_hash = crypt($2, password_hash)) AS is_password_valid
         FROM admin_users 
        WHERE LOWER(username) = LOWER($1)`,
      [username, password]
    );

    const user = adminRes.rows[0];

    if (!user || !user.is_password_valid || !user.is_active) {
      // Increment brute force counter
      try {
        const count = await cache.incr(bruteKey);
        if (count === 1) await cache.expire(bruteKey, 900); // 15 min TTL
      } catch {}

      // Write security audit event
      try {
        await auditLogService.record({
          adminId: user?.id || 'UNKNOWN_IDENTITY',
          adminUsername: username,
          action: 'ADMIN_LOGIN_FAILED',
          entityType: 'admin_auth',
          entityId: username,
          newValue: { reason: !user ? 'USER_NOT_FOUND' : !user.is_active ? 'ACCOUNT_INACTIVE' : 'PASSWORD_MISMATCH' },
          ipAddress: ip,
          userAgent: request.headers['user-agent'],
        });
      } catch {}

      return reply.status(401).send({
        success: false,
        error: 'Invalid administrative credentials or inactive account.',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Clear brute force lockout on success
    try {
      await cache.del(bruteKey);
    } catch {}

    // Update last login timestamp
    await pool.query(`UPDATE admin_users SET last_login_at = NOW() WHERE id = $1`, [user.id]);

    // Sign isolated Admin JWT Token
    const token = signAdminToken({
      adminId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // Store active session in Valkey / Redis (8h TTL)
    try {
      await cache.set(`admin_session:${user.id}`, 'active', 'EX', 28800);
    } catch {}

    // Audit log successful authentication
    try {
      await auditLogService.record({
        adminId: user.id,
        adminUsername: user.username,
        action: 'ADMIN_LOGIN_SUCCESS',
        entityType: 'admin_auth',
        entityId: user.id,
        newValue: { role: user.role },
        ipAddress: ip,
        userAgent: request.headers['user-agent'],
      });
    } catch {}

    return reply.send({
      success: true,
      token,
      admin: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  });

  fastify.post('/admin/auth/logout', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    const admin = request.admin!;
    try {
      await cache.del(`admin_session:${admin.adminId}`);
    } catch {}

    try {
      await auditLogService.record({
        adminId: admin.adminId,
        adminUsername: admin.username,
        action: 'ADMIN_LOGOUT',
        entityType: 'admin_auth',
        entityId: admin.adminId,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
      });
    } catch {}

    return reply.send({ success: true, message: 'Administrative session terminated.' });
  });

  fastify.get('/admin/auth/me', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    return reply.send({ success: true, admin: request.admin });
  });

  // ============================================================================
  // 2. DASHBOARD KPIS (OPTIMIZED INDEXED QUERIES & VALKEY CACHING)
  // ============================================================================

  fastify.get('/admin/dashboard', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    const queryParams = (request.query || {}) as { refresh?: string };
    const cacheKey = 'cache:admin:dashboard:metrics';

    if (queryParams.refresh !== 'true') {
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return reply.send(JSON.parse(cached));
        }
      } catch {}
    }

    // High-performance indexed aggregations
    const [subCount, playerCount, tournCount, fraudCount, revCount, coinsCount] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM subscriptions_v2 WHERE is_active = TRUE`),
      pool.query(`SELECT COUNT(*) as count FROM profiles`),
      pool.query(`SELECT COUNT(*) as count FROM tournaments WHERE status = 'ACTIVE'`),
      pool.query(`SELECT COUNT(*) as count FROM game_sessions WHERE fraud_flag = TRUE`),
      pool.query(`SELECT COALESCE(SUM(amount_etb), 0) as revenue FROM payment_orders WHERE status = 'SUCCESS'`),
      pool.query(`SELECT COALESCE(SUM(coins), 0) as circulating_coins FROM profiles`),
    ]);

    const activeSubs = parseInt(subCount.rows[0]?.count || '0', 10);
    const totalPlayers = parseInt(playerCount.rows[0]?.count || '0', 10);
    const activeTournaments = parseInt(tournCount.rows[0]?.count || '0', 10);
    const fraudIncidents = parseInt(fraudCount.rows[0]?.count || '0', 10);
    const revenue = parseFloat(revCount.rows[0]?.revenue || '0');
    const totalCoins = parseInt(coinsCount.rows[0]?.circulating_coins || '0', 10);

    const payload = {
      activeSubscribers: activeSubs,
      totalPlayers: totalPlayers,
      activeTournaments: activeTournaments,
      fraudIncidentsBlocked: fraudIncidents,
      portalRevenueEtb: Math.round(revenue),
      totalCoinsCirculating: totalCoins,
      cachedAt: new Date().toISOString(),
    };

    // Cache metrics for 60 seconds to prevent DB lock contention
    try {
      await cache.set(cacheKey, JSON.stringify(payload), 'EX', 60);
    } catch {}

    return reply.send(payload);
  });

  // ============================================================================
  // 3. SUBSCRIBERS & PLAYERS (SERVER-SIDE PAGINATION & STRICT MSISDN MASKING)
  // ============================================================================

  fastify.get('/admin/subscribers', { preHandler: [requireSupportOrAbove] }, async (request, reply) => {
    const query = (request.query || {}) as {
      page?: string;
      limit?: string;
      search?: string;
      status?: string;
    };

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (query.status === 'active') {
      conditions.push(`s.is_active = TRUE`);
    } else if (query.status === 'inactive') {
      conditions.push(`s.is_active = FALSE`);
    }

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(`(p.phone ILIKE $${idx} OR p.display_name ILIKE $${idx})`);
      values.push(term);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(
      `SELECT COUNT(*) as total 
         FROM subscriptions_v2 s 
         JOIN profiles p ON s.user_id = p.id 
        ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    values.push(limit, offset);
    const subsRes = await pool.query(
      `SELECT s.id as subscription_id, s.plan, s.is_active, s.activated_at, s.expires_at, 
              p.id as user_id, p.display_name, p.coins, p.energy, p.phone, p.is_banned, p.ban_reason
         FROM subscriptions_v2 s 
         JOIN profiles p ON s.user_id = p.id 
        ${whereClause}
        ORDER BY s.activated_at DESC 
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    // Telebirr Compliance: Strict MSISDN Masking by default. Raw phone is stripped.
    const items = subsRes.rows.map((r: any) => {
      const normalized = normalizeEthiopianPhone(r.phone);
      return {
        id: r.subscription_id,
        userId: r.user_id,
        displayName: r.display_name,
        maskedMsisdn: normalized.isValid ? normalized.masked : '091*****989',
        plan: r.plan,
        isActive: r.is_active,
        isBanned: Boolean(r.is_banned),
        banReason: r.ban_reason || null,
        coins: parseInt(r.coins || '0', 10),
        energy: r.energy,
        activatedAt: r.activated_at,
        expiresAt: r.expires_at,
      };
    });

    return reply.send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      subscribers: items,
    });
  });

  // Explicit PII Unmasking with Immutable Audit Logging
  fastify.post('/admin/subscribers/:id/unmask', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;

    const userRes = await pool.query(
      `SELECT p.id, p.phone, p.display_name 
         FROM profiles p 
        WHERE p.id = $1 OR p.phone = $1`,
      [id]
    );

    if (userRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'User profile not found.' });
    }

    const targetUser = userRes.rows[0];

    // Log explicit compliance audit record
    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'PII_MSISDN_UNMASK_ACCESSED',
      entityType: 'profile',
      entityId: targetUser.id,
      newValue: { targetDisplayName: targetUser.display_name },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      userId: targetUser.id,
      displayName: targetUser.display_name,
      unmaskedPhone: targetUser.phone,
    });
  });

  // Player Ban / Unban Management
  fastify.post('/admin/players/:id/ban', { preHandler: [requireRole('SUPER_ADMIN', 'SUPPORT_AGENT')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { isBanned: boolean; reason?: string };

    const userRes = await pool.query(`SELECT id, is_banned, display_name FROM profiles WHERE id = $1`, [id]);
    if (userRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Player profile not found.' });
    }

    const current = userRes.rows[0];

    await pool.query(
      `UPDATE profiles 
          SET is_banned = $1, 
              ban_reason = $2, 
              banned_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
              banned_by = CASE WHEN $1 = TRUE THEN $3 ELSE NULL END,
              updated_at = NOW()
        WHERE id = $4`,
      [body.isBanned, body.reason || 'Administrative action', admin.adminId, id]
    );

    // Invalidate player active session in Valkey / Redis
    if (body.isBanned) {
      try {
        await cache.del(`session:${id}`);
      } catch {}
    }

    // Write immutable audit log
    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: body.isBanned ? 'PLAYER_BANNED' : 'PLAYER_UNBANNED',
      entityType: 'profile',
      entityId: id,
      oldValue: { isBanned: current.is_banned },
      newValue: { isBanned: body.isBanned, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: body.isBanned ? 'Player has been banned and session invalidated.' : 'Player ban revoked.',
    });
  });

  // Manual Coin Balance Adjustment
  fastify.post('/admin/players/:id/adjust-coins', { preHandler: [requireRole('SUPER_ADMIN', 'FINANCIAL_AUDITOR')] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { coinsDelta: number; reason: string };

    if (!body.coinsDelta || typeof body.coinsDelta !== 'number') {
      return reply.status(400).send({ success: false, error: 'coinsDelta must be a non-zero integer.' });
    }

    const userRes = await pool.query(`SELECT id, coins, display_name FROM profiles WHERE id = $1`, [id]);
    if (userRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Player profile not found.' });
    }

    const currentCoins = parseInt(userRes.rows[0].coins, 10);
    const refId = `ADMIN_ADJ_${Date.now()}`;

    const adjRes = await pool.query(
      `SELECT apply_coins($1, $2, $3, $4) as new_coins`,
      [id, body.coinsDelta, body.reason || 'Manual Admin Balance Adjustment', refId]
    );

    const newCoins = adjRes.rows[0]?.new_coins;

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'MANUAL_COIN_BALANCE_ADJUSTMENT',
      entityType: 'profile',
      entityId: id,
      oldValue: { coins: currentCoins },
      newValue: { coins: newCoins, delta: body.coinsDelta, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      newCoins,
      previousCoins: currentCoins,
      message: `Adjusted coins by ${body.coinsDelta}. New balance: ${newCoins}`,
    });
  });

  // ============================================================================
  // 4. GAMES CATALOG CONTROLLER
  // ============================================================================

  fastify.get('/admin/games', { preHandler: [requireSupportOrAbove] }, async () => {
    const gamesRes = await pool.query(
      `SELECT game_id, title, category, is_free, requires_coins, is_enabled, 
              max_score_per_sec, max_score, entry_fee_coins, min_duration_sec 
         FROM games 
        ORDER BY category, title`
    );
    return gamesRes.rows;
  });

  fastify.post('/admin/games/:id/toggle', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;

    const currentRes = await pool.query(`SELECT game_id, title, is_enabled FROM games WHERE game_id = $1`, [id]);
    if (currentRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Game not found.' });
    }

    const current = currentRes.rows[0];
    const newState = !current.is_enabled;

    await pool.query(`UPDATE games SET is_enabled = $1 WHERE game_id = $2`, [newState, id]);

    // Record Immutable Audit Log
    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'GAME_CATALOG_STATUS_TOGGLED',
      entityType: 'game',
      entityId: id,
      oldValue: { isEnabled: current.is_enabled, title: current.title },
      newValue: { isEnabled: newState },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, isEnabled: newState });
  });

  // ============================================================================
  // 5. TOURNAMENTS & AUTHORITATIVE SETTLEMENT
  // ============================================================================

  fastify.get('/admin/tournaments', { preHandler: [requireSupportOrAbove] }, async () => {
    const tournsRes = await pool.query(
      `SELECT t.id, t.title, t.game_id, t.start_date, t.end_date, t.prize_pool_etb, t.status,
              COALESCE(t.tournament_type, 'STANDARD') as tournament_type,
              g.title as game_title, g.category as game_category,
              (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) as total_entries
         FROM tournaments t
         JOIN games g ON t.game_id = g.game_id
        ORDER BY t.start_date DESC`
    );
    return tournsRes.rows;
  });

  // Create Tournament with Strict Single Active Daily/Weekly Constraint
  fastify.post('/admin/tournaments/create', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const admin = request.admin!;
    const body = (request.body || {}) as {
      id?: string;
      title: string;
      gameId: string;
      startDate: string;
      endDate: string;
      prizePoolEtb?: number;
      tournamentType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'STANDARD';
      status?: 'ACTIVE' | 'UPCOMING';
    };

    if (!body.title || !body.gameId || !body.endDate) {
      return reply.status(400).send({ success: false, error: 'title, gameId, and endDate are required.' });
    }

    const tournType = body.tournamentType || 'STANDARD';
    const status = body.status || 'ACTIVE';

    if (status === 'ACTIVE' && (tournType === 'DAILY' || tournType === 'WEEKLY')) {
      const activeCheck = await pool.query(
        `SELECT id, title FROM tournaments WHERE tournament_type = $1 AND status = 'ACTIVE'`,
        [tournType]
      );
      if (activeCheck.rowCount! > 0) {
        return reply.status(409).send({
          success: false,
          error: `An active ${tournType} tournament already exists: "${activeCheck.rows[0].title}". You cannot create or activate multiple ${tournType.toLowerCase()} tournaments at once.`,
        });
      }
    }

    const tournId = body.id || `tourn_${tournType.toLowerCase()}_${Date.now()}`;
    await pool.query(
      `INSERT INTO tournaments (id, title, game_id, start_date, end_date, prize_pool_etb, status, tournament_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        tournId,
        body.title,
        body.gameId,
        body.startDate || new Date().toISOString(),
        body.endDate,
        body.prizePoolEtb || 10000,
        status,
        tournType,
      ]
    );

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'TOURNAMENT_CREATED',
      entityType: 'tournament',
      entityId: tournId,
      newValue: { title: body.title, tournamentType: tournType, status },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, tournamentId: tournId });
  });

  fastify.get('/admin/tournaments/:id/leaderboard', { preHandler: [requireSupportOrAbove] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const leaderboard = await tournamentSettlementService.getLeaderboard(id, 20);
    return reply.send({ tournamentId: id, leaderboard });
  });

  // Idempotent Tournament Finalization & Prize Settlement with Distributed Locks
  fastify.post('/admin/tournaments/:id/finalize', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;

    const result = await tournamentSettlementService.finalizeTournament(
      id,
      admin.adminId,
      admin.username
    );

    if (!result.success) {
      return reply.status(409).send(result);
    }

    return reply.send(result);
  });

  // Manual Leaderboard Score Override
  fastify.post('/admin/tournaments/:id/override-score', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { userId: string; newScore: number; reason: string };

    if (body.newScore === undefined || !body.userId) {
      return reply.status(400).send({ success: false, error: 'userId and newScore are required.' });
    }

    const currentEntry = await pool.query(
      `SELECT score FROM tournament_entries WHERE tournament_id = $1 AND user_id = $2`,
      [id, body.userId]
    );

    if (currentEntry.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Tournament entry not found for user.' });
    }

    const oldScore = currentEntry.rows[0].score;

    await pool.query(
      `UPDATE tournament_entries 
          SET score = $1, submitted_at = NOW() 
        WHERE tournament_id = $2 AND user_id = $3`,
      [body.newScore, id, body.userId]
    );

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'TOURNAMENT_SCORE_MANUAL_OVERRIDE',
      entityType: 'tournament_entry',
      entityId: `${id}:${body.userId}`,
      oldValue: { score: oldScore },
      newValue: { score: body.newScore, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, message: 'Tournament entry score updated.', oldScore, newScore: body.newScore });
  });

  // ============================================================================
  // 6. FINANCIAL RECONCILIATION & TRANSACTION LEDGERS
  // ============================================================================

  fastify.get('/admin/transactions', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const query = (request.query || {}) as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM payment_orders`);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const ordersRes = await pool.query(
      `SELECT po.id, po.method, po.amount_etb, po.item_type, po.item_title, 
              po.coins, po.status, po.provider_ref, po.created_at, po.paid_at,
              p.display_name, p.phone
         FROM payment_orders po
         JOIN profiles p ON po.user_id = p.id
        ORDER BY po.created_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = ordersRes.rows.map((r: any) => {
      const normalized = normalizeEthiopianPhone(r.phone);
      return {
        id: r.id,
        method: r.method,
        amountEtb: parseFloat(r.amount_etb),
        itemType: r.item_type,
        itemTitle: r.item_title,
        coins: parseInt(r.coins, 10),
        status: r.status,
        providerRef: r.provider_ref || null,
        displayName: r.display_name,
        maskedMsisdn: normalized.isValid ? normalized.masked : '091*****989',
        createdAt: r.created_at,
        paidAt: r.paid_at,
      };
    });

    return reply.send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      transactions: items,
    });
  });

  fastify.get('/admin/payouts', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const query = (request.query || {}) as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM tournament_payouts`);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const payoutsRes = await pool.query(
      `SELECT tp.id, tp.tournament_id, tp.rank, tp.prize_etb, tp.prize_coins,
              tp.status, tp.telebirr_b2c_ref, tp.idempotency_key, tp.settled_at, 
              tp.created_at, tp.error_message,
              t.title as tournament_title,
              p.display_name, p.phone
         FROM tournament_payouts tp
         JOIN tournaments t ON tp.tournament_id = t.id
         JOIN profiles p ON tp.user_id = p.id
        ORDER BY tp.created_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = payoutsRes.rows.map((r: any) => {
      const normalized = normalizeEthiopianPhone(r.phone);
      return {
        id: r.id,
        tournamentId: r.tournament_id,
        tournamentTitle: r.tournament_title,
        rank: r.rank,
        prizeEtb: parseFloat(r.prize_etb),
        prizeCoins: r.prize_coins,
        status: r.status,
        telebirrB2cRef: r.telebirr_b2c_ref,
        idempotencyKey: r.idempotency_key,
        displayName: r.display_name,
        maskedMsisdn: normalized.isValid ? normalized.masked : '091*****989',
        settledAt: r.settled_at,
        createdAt: r.created_at,
        errorMessage: r.error_message,
      };
    });

    return reply.send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      payouts: items,
    });
  });

  // ============================================================================
  // 7. ANTI-CHEAT INSPECTION & SCORE INVALIDATION
  // ============================================================================

  fastify.get('/admin/anti-cheat/flagged', { preHandler: [requireRole('SUPER_ADMIN', 'TOURNAMENT_OPERATOR', 'SUPPORT_AGENT')] }, async (request, reply) => {
    const query = (request.query || {}) as { page?: string; limit?: string };
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const offset = (page - 1) * limit;

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM game_sessions WHERE fraud_flag = TRUE`);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    const sessionsRes = await pool.query(
      `SELECT gs.session_id, gs.game_id, gs.score, gs.server_duration_sec, 
              gs.max_velocity, gs.client_telemetry, gs.started_at, gs.completed_at,
              gs.user_id, gs.tournament_id,
              g.title as game_title,
              p.display_name, p.phone, p.is_banned
         FROM game_sessions gs
         JOIN games g ON gs.game_id = g.game_id
         LEFT JOIN profiles p ON gs.user_id = p.id
        WHERE gs.fraud_flag = TRUE
        ORDER BY gs.started_at DESC
        LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const items = sessionsRes.rows.map((r: any) => {
      const normalized = normalizeEthiopianPhone(r.phone || '');
      return {
        sessionId: r.session_id,
        gameId: r.game_id,
        gameTitle: r.game_title,
        userId: r.user_id,
        displayName: r.display_name || 'Player',
        maskedMsisdn: normalized.isValid ? normalized.masked : '091*****989',
        isBanned: Boolean(r.is_banned),
        score: r.score,
        serverDurationSec: parseFloat(r.server_duration_sec || '0'),
        maxVelocity: parseFloat(r.max_velocity || '0'),
        clientTelemetry: r.client_telemetry,
        tournamentId: r.tournament_id,
        startedAt: r.started_at,
        completedAt: r.completed_at,
      };
    });

    return reply.send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      flaggedSessions: items,
    });
  });

  fastify.post('/admin/anti-cheat/invalidate-session', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const admin = request.admin!;
    const body = (request.body || {}) as { sessionId: string; reason: string };

    if (!body.sessionId) {
      return reply.status(400).send({ success: false, error: 'sessionId is required.' });
    }

    const sessRes = await pool.query(
      `SELECT session_id, score, user_id, tournament_id FROM game_sessions WHERE session_id = $1`,
      [body.sessionId]
    );

    if (sessRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Game session not found.' });
    }

    const sess = sessRes.rows[0];

    // Mark verified = FALSE and score = 0
    await pool.query(
      `UPDATE game_sessions 
          SET verified = FALSE, score = 0, fraud_flag = TRUE 
        WHERE session_id = $1`,
      [body.sessionId]
    );

    // If associated with a tournament, recalculate or remove entry
    if (sess.tournament_id && sess.user_id) {
      await pool.query(
        `UPDATE tournament_entries 
            SET score = 0, submitted_at = NOW() 
          WHERE tournament_id = $1 AND user_id = $2`,
        [sess.tournament_id, sess.user_id]
      );
    }

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'ANTI_CHEAT_SESSION_INVALIDATED',
      entityType: 'game_session',
      entityId: body.sessionId,
      oldValue: { originalScore: sess.score },
      newValue: { invalidatedScore: 0, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      message: `Game session ${body.sessionId} invalidated and score revoked.`,
    });
  });

  // ============================================================================
  // 8. IMMUTABLE AUDIT LOGS QUERY (WORM COMPLIANCE TRAIL)
  // ============================================================================

  fastify.get('/admin/audit-logs', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const query = (request.query || {}) as {
      page?: string;
      limit?: string;
      action?: string;
      entityType?: string;
    };

    const logsData = await auditLogService.listLogs({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 25,
      action: query.action,
      entityType: query.entityType,
    });

    return reply.send(logsData);
  });
}
