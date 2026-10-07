import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAdminToken, verifyAuthToken, AdminJwtPayload, AdminRole } from '../utils/jwt.js';
import { cache } from '../config/cache.js';
import { pool } from '../config/database.js';

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminJwtPayload;
  }
}

/**
 * Tier-0 Zero-Trust Admin Authentication Middleware
 * Strictly isolates admin identity from player sessions.
 * 
 * Verifications executed:
 * 1. Bearer token extraction and format validation.
 * 2. Proactive rejection of player tokens with 403 Forbidden.
 * 3. Cryptographic signature and admin claim validation.
 * 4. Session revocation check in Valkey / Redis.
 * 5. Fallback DB active verification if cache is unreachable.
 */
export async function requireAdminAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      success: false,
      error: 'Authentication required. Missing or malformed Bearer token.',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  const token = authHeader.slice(7).trim();

  // 1. Proactively test if a player token was submitted to an admin route
  const playerPayload = verifyAuthToken(token);
  if (playerPayload && (playerPayload.role === 'player' || playerPayload.tokenType === 'player')) {
    reply.status(403).send({
      success: false,
      error: 'Access Denied: Player tokens are strictly prohibited from administrative endpoints.',
      code: 'PLAYER_TOKEN_REJECTED',
    });
    return;
  }

  // 2. Validate cryptographic signature and admin claim
  const adminPayload = verifyAdminToken(token);
  if (!adminPayload) {
    reply.status(401).send({
      success: false,
      error: 'Invalid, forged, or expired administrative token.',
      code: 'INVALID_ADMIN_TOKEN',
    });
    return;
  }

  // 3. Check token revocation in Valkey / Redis
  let sessionValid = false;
  try {
    const sessionExists = await cache.get(`admin_session:${adminPayload.adminId}`);
    if (sessionExists) {
      sessionValid = true;
    } else {
      reply.status(401).send({
        success: false,
        error: 'Admin session expired or revoked. Please log in again.',
        code: 'SESSION_REVOKED',
      });
      return;
    }
  } catch {
    // 4. Defense-in-depth: If Valkey is offline in failover, verify state in PostgreSQL
    try {
      const dbCheck = await pool.query(
        `SELECT id, role, is_active FROM admin_users WHERE id = $1`,
        [adminPayload.adminId]
      );
      if (dbCheck.rowCount === 0 || !dbCheck.rows[0].is_active) {
        reply.status(401).send({
          success: false,
          error: 'Administrator account is deactivated or no longer exists.',
          code: 'ADMIN_ACCOUNT_INACTIVE',
        });
        return;
      }
      sessionValid = true;
    } catch (dbErr) {
      reply.status(500).send({
        success: false,
        error: 'Authentication backend failure during verification.',
        code: 'AUTH_BACKEND_ERROR',
      });
      return;
    }
  }

  request.admin = adminPayload;
}

/**
 * Factory for Role-Based Access Control hooks
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireAdminAuth(request, reply);
    if (reply.sent) return;

    const userRole = request.admin?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      reply.status(403).send({
        success: false,
        error: `Access Denied: Insufficient privilege. Active role '${userRole}' is not permitted. Required: [${allowedRoles.join(', ')}]`,
        code: 'INSUFFICIENT_ROLE_PRIVILEGE',
        requiredRoles: allowedRoles,
        userRole,
      });
      return;
    }
  };
}

// Granular RBAC Hooks
export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireTournamentOperator = requireRole('SUPER_ADMIN', 'TOURNAMENT_OPERATOR');
export const requireFinancialAuditor = requireRole('SUPER_ADMIN', 'FINANCIAL_AUDITOR');
export const requireSupportOrAbove = requireRole('SUPER_ADMIN', 'SUPPORT_AGENT', 'TOURNAMENT_OPERATOR', 'FINANCIAL_AUDITOR');
export const requireBanAuthority = requireRole('SUPER_ADMIN', 'SUPPORT_AGENT', 'TOURNAMENT_OPERATOR');
