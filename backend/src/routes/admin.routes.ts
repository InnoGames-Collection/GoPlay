import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pool } from '../config/database.js';
import { cache } from '../config/cache.js';
import { signAdminToken, AdminRole } from '../utils/jwt.js';
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
  requireBanAuthority,
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
        WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1)`,
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
    // Return current authenticated admin alongside all active admin personas from PostgreSQL
    const adminsRes = await pool.query(
      `SELECT id, username, email, role, is_active, last_login_at, created_at
         FROM admin_users
        WHERE is_active = TRUE
        ORDER BY username ASC`
    );

    const availableAdmins = adminsRes.rows.map((r: any) => ({
      id: r.id,
      name: r.username,
      username: r.username,
      email: r.email,
      role: r.role,
      active: Boolean(r.is_active),
      lastLogin: r.last_login_at,
      createdAt: r.created_at,
    }));

    return reply.send({
      success: true,
      admin: request.admin,
      availableAdmins,
    });
  });

  // Switch persona (Super Admin privileged delegation for operational switching)
  fastify.post('/admin/auth/switch', { preHandler: [requireSuperAdmin] }, async (request, reply) => {
    const admin = request.admin!;
    const body = (request.body || {}) as { targetAdminId: string };

    if (!body.targetAdminId) {
      return reply.status(400).send({ success: false, error: 'targetAdminId is required.' });
    }

    const targetRes = await pool.query(
      `SELECT id, username, email, role, is_active FROM admin_users WHERE id = $1`,
      [body.targetAdminId]
    );

    if (targetRes.rowCount === 0 || !targetRes.rows[0].is_active) {
      return reply.status(404).send({ success: false, error: 'Target administrator account not found or inactive.' });
    }

    const target = targetRes.rows[0];

    const newToken = signAdminToken({
      adminId: target.id,
      username: target.username,
      email: target.email,
      role: target.role,
    });

    try {
      await cache.set(`admin_session:${target.id}`, 'active', 'EX', 28800);
    } catch {}

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'ADMIN_PERSONA_SWITCHED',
      entityType: 'admin_auth',
      entityId: target.id,
      newValue: { targetUsername: target.username, targetRole: target.role },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({
      success: true,
      token: newToken,
      currentAdmin: {
        id: target.id,
        name: target.username,
        username: target.username,
        email: target.email,
        role: target.role,
        active: true,
      },
    });
  });

  // ============================================================================
  // 2. DASHBOARD KPIS & LIVE AGGREGATIONS (ZERO MOCK DATA)
  // ============================================================================

  fastify.get('/admin/dashboard', { preHandler: [requireAdminAuth] }, async (request, reply) => {
    const queryParams = (request.query || {}) as { refresh?: string };
    const cacheKey = 'cache:admin:dashboard:metrics';

    let kpis = null;

    if (queryParams.refresh !== 'true') {
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          kpis = JSON.parse(cached);
        }
      } catch {}
    }

    if (!kpis) {
      // High-performance indexed aggregations
      const [subCount, playerCount, tournCount, fraudCount, revCount, coinsCount] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM subscriptions_v2 WHERE is_active = TRUE`),
        pool.query(`SELECT COUNT(*) as count FROM profiles`),
        pool.query(`SELECT COUNT(*) as count FROM tournaments WHERE status = 'ACTIVE'`),
        pool.query(`SELECT COUNT(*) as count FROM game_sessions WHERE fraud_flag = TRUE`),
        pool.query(`SELECT COALESCE(SUM(amount_etb), 0) as revenue FROM payment_orders WHERE status = 'SUCCESS'`),
        pool.query(`SELECT COALESCE(SUM(coins), 0) as circulating_coins FROM profiles`),
      ]);

      kpis = {
        activeSubscribers: parseInt(subCount.rows[0]?.count || '0', 10),
        totalPlayers: parseInt(playerCount.rows[0]?.count || '0', 10),
        activeTournaments: parseInt(tournCount.rows[0]?.count || '0', 10),
        fraudIncidentsBlocked: parseInt(fraudCount.rows[0]?.count || '0', 10),
        portalRevenueEtb: Math.round(parseFloat(revCount.rows[0]?.revenue || '0')),
        totalCoinsCirculating: parseInt(coinsCount.rows[0]?.circulating_coins || '0', 10),
        cachedAt: new Date().toISOString(),
      };

      try {
        await cache.set(cacheKey, JSON.stringify(kpis), 'EX', 60);
      } catch {}
    }

    // Fetch live active standard tournament
    const activeTournRes = await pool.query(
      `SELECT t.id, t.title, t.game_id, t.start_date, t.end_date, t.prize_pool_etb, t.status,
              g.title as game_title, g.category as game_category,
              (SELECT COUNT(*) FROM tournament_entries WHERE tournament_id = t.id) as participants_count,
              (SELECT COALESCE(MAX(score), 0) FROM tournament_entries WHERE tournament_id = t.id) as top_score
         FROM tournaments t
         JOIN games g ON t.game_id = g.game_id
        WHERE t.status = 'ACTIVE' AND t.tournament_type != 'DAILY'
        ORDER BY t.start_date DESC
        LIMIT 1`
    );

    let activeTournament = null;
    if (activeTournRes.rowCount! > 0) {
      const at = activeTournRes.rows[0];
      activeTournament = {
        id: at.id,
        title: at.title,
        gameId: at.game_id,
        gameTitle: at.game_title,
        gameCategory: at.game_category,
        startDate: at.start_date,
        endDate: at.end_date,
        prizePoolEtb: parseFloat(at.prize_pool_etb || '0'),
        status: at.status,
        participantsCount: parseInt(at.participants_count || '0', 10),
        topScore: parseInt(at.top_score || '0', 10),
      };
    }

    // Fetch live daily challenge tournament
    const dailyChallengeRes = await pool.query(
      `SELECT t.id, t.title, t.game_id, t.start_date, t.end_date, t.prize_pool_etb, t.status,
              g.title as game_title, g.entry_fee_coins,
              (SELECT COUNT(DISTINCT user_id) FROM daily_challenge_attempts WHERE tournament_id = t.id) as participants_count,
              (SELECT COUNT(*) FROM daily_challenge_attempts WHERE tournament_id = t.id AND score >= 1000) as completed_count,
              (SELECT COALESCE(MAX(score), 0) FROM daily_challenge_attempts WHERE tournament_id = t.id) as top_score
         FROM tournaments t
         JOIN games g ON t.game_id = g.game_id
        WHERE t.tournament_type = 'DAILY'
        ORDER BY t.start_date DESC
        LIMIT 1`
    );

    let dailyChallenge = null;
    if (dailyChallengeRes.rowCount! > 0) {
      const dc = dailyChallengeRes.rows[0];
      dailyChallenge = {
        id: dc.id,
        date: new Date(dc.start_date).toISOString().split('T')[0],
        status: dc.status === 'ACTIVE' ? 'OPEN' : dc.status === 'FINALIZED' ? 'CLOSED' : 'NOT_CONFIGURED',
        title: dc.title,
        gameId: dc.game_id,
        gameTitle: dc.game_title,
        startTime: '00:00',
        endTime: '23:59',
        entryFeeCoins: dc.entry_fee_coins || 10,
        targetScore: 2500,
        prizePoolBirr: parseFloat(dc.prize_pool_etb || '500'),
        prizeRules: [
          { rank: 1, label: '1st Place', prizeAmountBirr: 250, prizeType: 'TELEBIRR_CASH', description: 'Immediate Telebirr disbursement' },
          { rank: 2, label: '2nd Place', prizeAmountBirr: 150, prizeType: 'AIRTIME', description: 'Ethio Telecom airtime voucher' },
          { rank: 3, label: '3rd Place', prizeAmountBirr: 100, prizeType: 'COINS', description: '500 GoPlay Coins topup' },
        ],
        eligibilityNotes: 'Requires active subscription to shortcode 9898.',
        participantsCount: parseInt(dc.participants_count || '0', 10),
        completedCount: parseInt(dc.completed_count || '0', 10),
        topScore: parseInt(dc.top_score || '0', 10),
      };
    }

    // Fetch live recent audit activities (latest 5)
    const recentRes = await pool.query(
      `SELECT aal.id, aal.admin_id, aal.admin_username, aal.action, aal.entity_type, aal.entity_id, 
              aal.old_value, aal.new_value, aal.ip_address, aal.timestamp,
              COALESCE(au.role, 'OPERATOR') as admin_role
         FROM admin_audit_logs aal
         LEFT JOIN admin_users au ON aal.admin_id = au.id::text
        ORDER BY aal.timestamp DESC
        LIMIT 5`
    );

    const recentActivity = recentRes.rows.map((l: any) => ({
      id: l.id,
      timestamp: l.timestamp,
      adminId: l.admin_id,
      adminName: l.admin_username,
      adminRole: l.admin_role,
      action: l.action,
      entityType: l.entity_type,
      entityId: l.entity_id,
      oldValue: l.old_value,
      newValue: l.new_value,
      ipAddress: l.ip_address,
      reason: l.new_value?.reason || l.action,
    }));

    return reply.send({
      mode: 'PRODUCTION',
      kpis,
      activeTournament,
      dailyChallenge,
      recentActivity,
    });
  });

  // ============================================================================
  // 3. SUBSCRIBERS & PLAYERS (SERVER-SIDE PAGINATION & STRICT MSISDN MASKING)
  // ============================================================================

  // Full Directory of Registered Players
  fastify.get('/admin/players', { preHandler: [requireSupportOrAbove] }, async (request, reply) => {
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

    if (query.status === 'ACTIVE') {
      conditions.push(`p.is_banned = FALSE`);
    } else if (query.status === 'BANNED') {
      conditions.push(`p.is_banned = TRUE`);
    }

    if (query.search && query.search.trim()) {
      const term = `%${query.search.trim()}%`;
      conditions.push(`(p.phone ILIKE $${idx} OR p.display_name ILIKE $${idx})`);
      values.push(term);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM profiles p ${whereClause}`, values);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    values.push(limit, offset);
    const playersRes = await pool.query(
      `SELECT p.id, p.display_name, p.phone, p.coins, p.energy, p.is_banned, p.ban_reason, 
              p.created_at, p.updated_at,
              COALESCE(s.is_active, FALSE) as is_subscribed,
              COALESCE(s.plan, 'Daily 2 ETB') as plan,
              COALESCE((
                SELECT SUM(prize_etb) 
                  FROM tournament_payouts 
                 WHERE user_id = p.id AND status = 'SETTLED'
              ), 0) as total_prizes_won,
              COALESCE((
                SELECT COUNT(*) 
                  FROM tournament_entries 
                 WHERE user_id = p.id
              ), 0) as tournaments_entered
         FROM profiles p
         LEFT JOIN subscriptions_v2 s ON s.user_id = p.id AND s.is_active = TRUE
        ${whereClause}
        ORDER BY p.created_at DESC
        LIMIT $${idx++} OFFSET $${idx++}`,
      values
    );

    // Strictly mask phone numbers: +25191****5678. Raw phone numbers are NEVER returned here.
    const items = playersRes.rows.map((r: any) => {
      const norm = normalizeEthiopianPhone(r.phone);
      return {
        id: r.id,
        userId: r.id,
        displayName: r.display_name,
        msisdn: norm.isValid ? norm.masked : '+25191****5678',
        maskedMsisdn: norm.isValid ? norm.masked : '+25191****5678',
        accountStatus: r.is_banned ? 'BANNED' : 'ACTIVE',
        isBanned: Boolean(r.is_banned),
        banReason: r.ban_reason || undefined,
        subscriptionStatus: r.is_subscribed ? 'ACTIVE' : 'INACTIVE',
        plan: r.plan,
        coins: parseInt(r.coins || '0', 10),
        energy: r.energy || 5,
        registeredAt: r.created_at ? new Date(r.created_at).toISOString().split('T')[0] : '2026-09-01',
        lastActivity: r.updated_at || new Date().toISOString(),
        tournamentsEntered: parseInt(r.tournaments_entered || '0', 10),
        totalPrizesWonBirr: parseFloat(r.total_prizes_won || '0'),
        telecomCircle: 'ADDIS_ABABA',
      };
    });

    return reply.send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      players: items,
    });
  });

  // Dedicated Active Subscriptions View
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
        maskedMsisdn: normalized.isValid ? normalized.masked : '+25191****5678',
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
    const body = (request.body || {}) as { reason?: string };

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
      newValue: { targetDisplayName: targetUser.display_name, reason: body.reason || 'Auditor investigation' },
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

  // Player Ban / Unban Management (Authorized to Super Admin, Support, and Tournament Operator)
  fastify.post('/admin/players/:id/ban', { preHandler: [requireBanAuthority] }, async (request, reply) => {
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
  // 4. GAMES CATALOG CONTROLLER & ANTI-CHEAT THRESHOLDS
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

  // Update Game Rules and Velocity Thresholds in Live Database
  fastify.put('/admin/games/:id/rules', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as {
      entryFeeCoins?: number;
      maxScorePerSec?: number;
      maxScore?: number;
      minDurationSec?: number;
      reason?: string;
    };

    const currentRes = await pool.query(`SELECT * FROM games WHERE game_id = $1`, [id]);
    if (currentRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Game not found.' });
    }

    const current = currentRes.rows[0];

    const newEntryFee = body.entryFeeCoins !== undefined ? body.entryFeeCoins : current.entry_fee_coins;
    const newMaxScorePerSec = body.maxScorePerSec !== undefined ? body.maxScorePerSec : current.max_score_per_sec;
    const newMaxScore = body.maxScore !== undefined ? body.maxScore : current.max_score;
    const newMinDuration = body.minDurationSec !== undefined ? body.minDurationSec : current.min_duration_sec;

    await pool.query(
      `UPDATE games 
          SET entry_fee_coins = $1, max_score_per_sec = $2, max_score = $3, min_duration_sec = $4
        WHERE game_id = $5`,
      [newEntryFee, newMaxScorePerSec, newMaxScore, newMinDuration, id]
    );

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'GAME_RULES_UPDATED',
      entityType: 'game',
      entityId: id,
      oldValue: {
        entry_fee_coins: current.entry_fee_coins,
        max_score_per_sec: current.max_score_per_sec,
        max_score: current.max_score,
        min_duration_sec: current.min_duration_sec,
      },
      newValue: {
        entry_fee_coins: newEntryFee,
        max_score_per_sec: newMaxScorePerSec,
        max_score: newMaxScore,
        min_duration_sec: newMinDuration,
        reason: body.reason || 'Operational rule adjustment',
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, message: 'Game parameters updated.' });
  });

  // ============================================================================
  // 5. TOURNAMENTS & AUTHORITATIVE SETTLEMENT
  // ============================================================================

  fastify.get('/admin/tournaments', { preHandler: [requireSupportOrAbove] }, async () => {
    const tournsRes = await pool.query(
      `SELECT t.id, t.title, t.game_id, t.start_date, t.end_date, t.prize_pool_etb, t.status,
              COALESCE(t.tournament_type, 'STANDARD') as tournament_type,
              g.title as game_title, g.category as game_category,
              (SELECT COUNT(*) FROM tournament_entries te WHERE te.tournament_id = t.id) as total_entries,
              (SELECT COALESCE(MAX(score), 0) FROM tournament_entries te WHERE te.tournament_id = t.id) as top_score
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
  // 6. DAILY CHALLENGES MANAGEMENT
  // ============================================================================

  fastify.get('/admin/daily-challenges', { preHandler: [requireSupportOrAbove] }, async () => {
    const tournsRes = await pool.query(
      `SELECT t.id, t.title, t.game_id, t.start_date, t.end_date, t.prize_pool_etb, t.status,
              g.title as game_title, g.entry_fee_coins,
              (SELECT COUNT(DISTINCT user_id) FROM daily_challenge_attempts WHERE tournament_id = t.id) as participants_count,
              (SELECT COUNT(*) FROM daily_challenge_attempts WHERE tournament_id = t.id AND score >= 1000) as completed_count,
              (SELECT COALESCE(MAX(score), 0) FROM daily_challenge_attempts WHERE tournament_id = t.id) as top_score
         FROM tournaments t
         JOIN games g ON t.game_id = g.game_id
        WHERE t.tournament_type = 'DAILY'
        ORDER BY t.start_date DESC`
    );

    return tournsRes.rows.map((dc: any) => ({
      id: dc.id,
      date: new Date(dc.start_date).toISOString().split('T')[0],
      status: dc.status === 'ACTIVE' ? 'OPEN' : dc.status === 'FINALIZED' ? 'CLOSED' : 'NOT_CONFIGURED',
      title: dc.title,
      gameId: dc.game_id,
      gameTitle: dc.game_title,
      startTime: '00:00',
      endTime: '23:59',
      entryFeeCoins: dc.entry_fee_coins || 10,
      targetScore: 2500,
      prizePoolBirr: parseFloat(dc.prize_pool_etb || '500'),
      prizeRules: [
        { rank: 1, label: '1st Place', prizeAmountBirr: 250, prizeType: 'TELEBIRR_CASH', description: 'Immediate Telebirr disbursement' },
        { rank: 2, label: '2nd Place', prizeAmountBirr: 150, prizeType: 'AIRTIME', description: 'Ethio Telecom airtime voucher' },
        { rank: 3, label: '3rd Place', prizeAmountBirr: 100, prizeType: 'COINS', description: '500 GoPlay Coins topup' },
      ],
      eligibilityNotes: 'Requires active daily subscription to 9898.',
      participantsCount: parseInt(dc.participants_count || '0', 10),
      completedCount: parseInt(dc.completed_count || '0', 10),
      topScore: parseInt(dc.top_score || '0', 10),
    }));
  });

  fastify.get('/admin/daily-challenges/:id', { preHandler: [requireSupportOrAbove] }, async (request, reply) => {
    const { id } = request.params as { id: string };

    const challengeRes = await pool.query(
      `SELECT t.id, t.title, t.game_id, t.start_date, t.end_date, t.prize_pool_etb, t.status,
              g.title as game_title, g.entry_fee_coins,
              (SELECT COUNT(DISTINCT user_id) FROM daily_challenge_attempts WHERE tournament_id = t.id) as participants_count,
              (SELECT COUNT(*) FROM daily_challenge_attempts WHERE tournament_id = t.id AND score >= 1000) as completed_count,
              (SELECT COALESCE(MAX(score), 0) FROM daily_challenge_attempts WHERE tournament_id = t.id) as top_score
         FROM tournaments t
         JOIN games g ON t.game_id = g.game_id
        WHERE t.id = $1`,
      [id]
    );

    if (challengeRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Daily challenge not found.' });
    }

    const dc = challengeRes.rows[0];

    const attemptsRes = await pool.query(
      `SELECT dca.id, dca.tournament_id, dca.user_id, dca.score, dca.created_at,
              p.display_name, p.phone
         FROM daily_challenge_attempts dca
         JOIN profiles p ON dca.user_id = p.id
        WHERE dca.tournament_id = $1
        ORDER BY dca.score DESC, dca.created_at ASC
        LIMIT 50`,
      [id]
    );

    const participants = attemptsRes.rows.map((att: any, idx: number) => {
      const norm = normalizeEthiopianPhone(att.phone);
      return {
        id: att.id,
        challengeId: att.tournament_id,
        playerId: att.user_id,
        displayName: att.display_name,
        maskedMsisdn: norm.isValid ? norm.masked : '+25191****5678',
        score: parseInt(att.score || '0', 10),
        rank: idx + 1,
        completed: parseInt(att.score || '0', 10) >= 2500,
        eligibleForPrize: true,
        prizeAssignedBirr: idx === 0 ? 250 : idx === 1 ? 150 : idx === 2 ? 100 : 0,
        submittedAt: att.created_at,
      };
    });

    return reply.send({
      challenge: {
        id: dc.id,
        date: new Date(dc.start_date).toISOString().split('T')[0],
        status: dc.status === 'ACTIVE' ? 'OPEN' : dc.status === 'FINALIZED' ? 'CLOSED' : 'NOT_CONFIGURED',
        title: dc.title,
        gameId: dc.game_id,
        gameTitle: dc.game_title,
        startTime: '00:00',
        endTime: '23:59',
        entryFeeCoins: dc.entry_fee_coins || 10,
        targetScore: 2500,
        prizePoolBirr: parseFloat(dc.prize_pool_etb || '500'),
        participantsCount: parseInt(dc.participants_count || '0', 10),
        completedCount: parseInt(dc.completed_count || '0', 10),
        topScore: parseInt(dc.top_score || '0', 10),
      },
      participants,
    });
  });

  fastify.post('/admin/daily-challenges/:id/status', { preHandler: [requireTournamentOperator] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { status: string; reason?: string };

    const dbStatus = body.status === 'OPEN' ? 'ACTIVE' : body.status === 'CLOSED' ? 'FINALIZED' : 'UPCOMING';

    await pool.query(`UPDATE tournaments SET status = $1 WHERE id = $2`, [dbStatus, id]);

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'DAILY_CHALLENGE_STATUS_UPDATED',
      entityType: 'daily_challenge',
      entityId: id,
      newValue: { targetStatus: body.status, dbStatus, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, message: `Daily challenge updated to ${body.status}` });
  });

  // ============================================================================
  // 7. FINANCIAL RECONCILIATION & TRANSACTION LEDGERS
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
        maskedMsisdn: normalized.isValid ? normalized.masked : '+25191****5678',
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
              COALESCE(t.title, 'Special Administrative Payout') as tournament_title,
              p.display_name, p.phone
         FROM tournament_payouts tp
         LEFT JOIN tournaments t ON tp.tournament_id = t.id
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
        maskedMsisdn: normalized.isValid ? normalized.masked : '+25191****5678',
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

  fastify.post('/admin/payouts/:id/retry', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { reason?: string };

    const result = await tournamentSettlementService.retryPayout(
      id,
      admin.adminId,
      admin.username,
      body.reason || 'Auditor re-disbursement retry'
    );

    if (!result.success) {
      return reply.status(409).send(result);
    }

    return reply.send(result);
  });

  fastify.post('/admin/payouts/override', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const admin = request.admin!;
    const body = (request.body || {}) as {
      msisdn: string;
      prizeEtb: number;
      prizeCoins: number;
      reason: string;
    };

    if (!body.msisdn || body.prizeEtb === undefined || !body.reason) {
      return reply.status(400).send({ success: false, error: 'msisdn, prizeEtb, and reason are required.' });
    }

    const result = await tournamentSettlementService.createManualPrizeOverride({
      msisdn: body.msisdn,
      prizeEtb: Number(body.prizeEtb),
      prizeCoins: Number(body.prizeCoins || 0),
      reason: body.reason,
      adminId: admin.adminId,
      adminUsername: admin.username,
    });

    if (!result.success) {
      return reply.status(409).send(result);
    }

    return reply.send(result);
  });

  // ============================================================================
  // 8. ANTI-CHEAT INSPECTION & SCORE INVALIDATION
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
        maskedMsisdn: normalized.isValid ? normalized.masked : '+25191****5678',
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
  // 9. TELECOM FINANCIAL REPORTS & RECONCILIATION
  // ============================================================================

  fastify.get('/admin/reports', { preHandler: [requireFinancialAuditor] }, async (request, reply) => {
    const query = (request.query || {}) as { range?: string };
    const range = query.range || 'LAST_30_DAYS';

    let dateCondition = `created_at >= NOW() - INTERVAL '30 days'`;
    if (range === 'TODAY') {
      dateCondition = `created_at >= CURRENT_DATE`;
    } else if (range === 'THIS_WEEK') {
      dateCondition = `created_at >= DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (range === 'YEAR_TO_DATE' || range === 'ALL_TIME') {
      dateCondition = `1=1`;
    }

    const [revRes, subRes, payRes, fraudRes] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(amount_etb), 0) as total FROM payment_orders WHERE status = 'SUCCESS' AND ${dateCondition}`),
      pool.query(`SELECT COUNT(*) as total FROM subscriptions_v2 WHERE is_active = TRUE`),
      pool.query(`SELECT COALESCE(SUM(prize_etb), 0) as total FROM tournament_payouts WHERE status = 'SETTLED'`),
      pool.query(`SELECT COUNT(*) as total FROM game_sessions WHERE fraud_flag = TRUE`),
    ]);

    const grossRevenue = parseFloat(revRes.rows[0]?.total || '0');
    const activeSubscribers = parseInt(subRes.rows[0]?.total || '0', 10);
    const payoutsDisbursed = parseFloat(payRes.rows[0]?.total || '0');
    const fraudBlocked = parseInt(fraudRes.rows[0]?.total || '0', 10);

    return reply.send({
      grossRevenue,
      activeSubscribers,
      payoutsDisbursed,
      fraudBlocked,
    });
  });

  // ============================================================================
  // 10. VAS SERVICE SETTINGS & CONFIGURATION
  // ============================================================================

  fastify.get('/admin/settings', { preHandler: [requireSupportOrAbove] }, async () => {
    const settingsRes = await pool.query(
      `SELECT id, service_name, shortcode, subscription_instruction, 
              daily_subscription_price_birr, daily_challenge_enabled, 
              weekly_competition_enabled, auto_finalize_winners, 
              telebirr_disbursement_enabled, anti_cheat_sensitivity, 
              max_velocity_threshold, support_contact, service_notice_banner, 
              updated_at, updated_by
         FROM service_settings
        WHERE id = 'default'
        LIMIT 1`
    );

    if (settingsRes.rowCount === 0) {
      return {
        serviceName: 'GameON Tele / GoPlay',
        shortcode: '9898',
        subscriptionInstruction: 'Send OK to 9898 to activate daily gaming subscription for 2 ETB/day.',
        dailySubscriptionPriceBirr: 2,
        dailyChallengeEnabled: true,
        weeklyCompetitionEnabled: true,
        autoFinalizeWinners: true,
        telebirrDisbursementEnabled: true,
        antiCheatSensitivity: 'STANDARD',
        maxVelocityThreshold: 50,
        supportContact: 'support@innogames.et • Shortcode 9898',
        serviceNoticeBanner: 'Welcome to GoPlay! Compete in weekly tournaments and claim Telebirr cash rewards.',
      };
    }

    const s = settingsRes.rows[0];
    return {
      serviceName: s.service_name,
      shortcode: s.shortcode,
      subscriptionInstruction: s.subscription_instruction,
      dailySubscriptionPriceBirr: parseFloat(s.daily_subscription_price_birr || '2'),
      dailyChallengeEnabled: Boolean(s.daily_challenge_enabled),
      weeklyCompetitionEnabled: Boolean(s.weekly_competition_enabled),
      autoFinalizeWinners: Boolean(s.auto_finalize_winners),
      telebirrDisbursementEnabled: Boolean(s.telebirr_disbursement_enabled),
      antiCheatSensitivity: s.anti_cheat_sensitivity,
      maxVelocityThreshold: s.max_velocity_threshold,
      supportContact: s.support_contact,
      serviceNoticeBanner: s.service_notice_banner,
      updatedAt: s.updated_at,
      updatedBy: s.updated_by,
    };
  });

  fastify.put('/admin/settings', { preHandler: [requireSuperAdmin] }, async (request, reply) => {
    const admin = request.admin!;
    const body = request.body as any;

    const currentRes = await pool.query(`SELECT * FROM service_settings WHERE id = 'default'`);
    const current = currentRes.rows[0] || {};

    await pool.query(
      `INSERT INTO service_settings (
         id, service_name, shortcode, subscription_instruction, 
         daily_subscription_price_birr, daily_challenge_enabled, 
         weekly_competition_enabled, auto_finalize_winners, 
         telebirr_disbursement_enabled, anti_cheat_sensitivity, 
         max_velocity_threshold, support_contact, service_notice_banner, 
         updated_at, updated_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), $14)
       ON CONFLICT (id) DO UPDATE SET
         service_name = EXCLUDED.service_name,
         shortcode = EXCLUDED.shortcode,
         subscription_instruction = EXCLUDED.subscription_instruction,
         daily_subscription_price_birr = EXCLUDED.daily_subscription_price_birr,
         daily_challenge_enabled = EXCLUDED.daily_challenge_enabled,
         weekly_competition_enabled = EXCLUDED.weekly_competition_enabled,
         auto_finalize_winners = EXCLUDED.auto_finalize_winners,
         telebirr_disbursement_enabled = EXCLUDED.telebirr_disbursement_enabled,
         anti_cheat_sensitivity = EXCLUDED.anti_cheat_sensitivity,
         max_velocity_threshold = EXCLUDED.max_velocity_threshold,
         support_contact = EXCLUDED.support_contact,
         service_notice_banner = EXCLUDED.service_notice_banner,
         updated_at = NOW(),
         updated_by = EXCLUDED.updated_by`,
      [
        'default',
        body.serviceName || current.service_name || 'GameON Tele / GoPlay',
        body.shortcode || current.shortcode || '9898',
        body.subscriptionInstruction || current.subscription_instruction || '',
        body.dailySubscriptionPriceBirr !== undefined ? body.dailySubscriptionPriceBirr : 2,
        body.dailyChallengeEnabled !== undefined ? body.dailyChallengeEnabled : true,
        body.weeklyCompetitionEnabled !== undefined ? body.weeklyCompetitionEnabled : true,
        body.autoFinalizeWinners !== undefined ? body.autoFinalizeWinners : true,
        body.telebirrDisbursementEnabled !== undefined ? body.telebirrDisbursementEnabled : true,
        body.antiCheatSensitivity || current.anti_cheat_sensitivity || 'STANDARD',
        body.maxVelocityThreshold !== undefined ? body.maxVelocityThreshold : 50,
        body.supportContact || current.support_contact || '',
        body.serviceNoticeBanner || current.service_notice_banner || '',
        admin.username,
      ]
    );

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'SERVICE_SETTINGS_UPDATED',
      entityType: 'service_settings',
      entityId: 'default',
      oldValue: current,
      newValue: body,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, message: 'VAS service settings updated.' });
  });

  // ============================================================================
  // 11. ADMIN USERS & RBAC ACCESS CONTROL
  // ============================================================================

  fastify.get('/admin/users', { preHandler: [requireSuperAdmin] }, async () => {
    const res = await pool.query(
      `SELECT id, username, email, role, is_active, last_login_at, created_at
         FROM admin_users
        ORDER BY created_at ASC`
    );

    return res.rows.map((r: any) => ({
      id: r.id,
      name: r.username,
      username: r.username,
      email: r.email,
      role: r.role,
      active: Boolean(r.is_active),
      lastLogin: r.last_login_at,
      createdAt: r.created_at,
    }));
  });

  fastify.post('/admin/users', { preHandler: [requireSuperAdmin] }, async (request, reply) => {
    const admin = request.admin!;
    const body = (request.body || {}) as {
      username: string;
      email: string;
      password?: string;
      role: AdminRole;
      reason?: string;
    };

    if (!body.username || !body.email || !body.password) {
      return reply.status(400).send({ success: false, error: 'username, email, and password are required.' });
    }

    const checkRes = await pool.query(
      `SELECT id FROM admin_users WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($2)`,
      [body.username, body.email]
    );

    if (checkRes.rowCount! > 0) {
      return reply.status(409).send({ success: false, error: 'Administrator with this username or email already exists.' });
    }

    const newRes = await pool.query(
      `INSERT INTO admin_users (username, email, password_hash, role, is_active)
       VALUES ($1, $2, crypt($3, gen_salt('bf', 10)), $4, TRUE)
       RETURNING id, username, email, role`,
      [body.username.trim(), body.email.trim(), body.password, body.role || 'TOURNAMENT_OPERATOR']
    );

    const created = newRes.rows[0];

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'ADMIN_USER_CREATED',
      entityType: 'admin_user',
      entityId: created.id,
      newValue: { username: created.username, email: created.email, role: created.role, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, user: created });
  });

  fastify.put('/admin/users/:id/role', { preHandler: [requireSuperAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { role: AdminRole; reason?: string };

    if (!body.role) {
      return reply.status(400).send({ success: false, error: 'role is required.' });
    }

    const currentRes = await pool.query(`SELECT id, username, role FROM admin_users WHERE id = $1`, [id]);
    if (currentRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Admin user not found.' });
    }

    const current = currentRes.rows[0];

    await pool.query(`UPDATE admin_users SET role = $1, updated_at = NOW() WHERE id = $2`, [body.role, id]);

    // Invalidate active session so next request re-authenticates with new claims
    try {
      await cache.del(`admin_session:${id}`);
    } catch {}

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: 'ADMIN_ROLE_UPDATED',
      entityType: 'admin_user',
      entityId: id,
      oldValue: { role: current.role },
      newValue: { role: body.role, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, message: `Role updated to ${body.role}` });
  });

  fastify.post('/admin/users/:id/toggle-active', { preHandler: [requireSuperAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const admin = request.admin!;
    const body = (request.body || {}) as { active: boolean; reason?: string };

    const currentRes = await pool.query(`SELECT id, username, is_active FROM admin_users WHERE id = $1`, [id]);
    if (currentRes.rowCount === 0) {
      return reply.status(404).send({ success: false, error: 'Admin user not found.' });
    }

    const current = currentRes.rows[0];

    await pool.query(`UPDATE admin_users SET is_active = $1, updated_at = NOW() WHERE id = $2`, [body.active, id]);

    if (!body.active) {
      try {
        await cache.del(`admin_session:${id}`);
      } catch {}
    }

    await auditLogService.record({
      adminId: admin.adminId,
      adminUsername: admin.username,
      action: body.active ? 'ADMIN_USER_ACTIVATED' : 'ADMIN_USER_DEACTIVATED',
      entityType: 'admin_user',
      entityId: id,
      oldValue: { is_active: current.is_active },
      newValue: { is_active: body.active, reason: body.reason },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return reply.send({ success: true, active: body.active });
  });

  // ============================================================================
  // 12. IMMUTABLE AUDIT LOGS QUERY (WORM COMPLIANCE TRAIL)
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
