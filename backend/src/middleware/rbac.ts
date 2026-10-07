import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAdminToken, verifyAuthToken, AdminJwtPayload, AdminRole } from '../utils/jwt.js';
import { cache } from '../config/cache.js';

declare module 'fastify' {
  interface FastifyRequest {
    admin?: AdminJwtPayload;
  }
}

/**
 * Tier-0 Zero-Trust Admin Authentication Middleware
 * Strictly isolates admin identity from player sessions.
 */
export async function requireAdminAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required. Missing or malformed Bearer token.',
      code: 'AUTH_REQUIRED',
    });
  }

  const token = authHeader.slice(7).trim();

  // 1. Proactively test if a player token was submitted to an admin route
  const playerPayload = verifyAuthToken(token);
  if (playerPayload && (playerPayload.role === 'player' || playerPayload.tokenType === 'player')) {
    return reply.status(403).send({
      success: false,
      error: 'Access Denied: Player tokens are strictly prohibited from administrative endpoints.',
      code: 'PLAYER_TOKEN_REJECTED',
    });
  }

  // 2. Validate cryptographic signature and admin claim
  const adminPayload = verifyAdminToken(token);
  if (!adminPayload) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid, forged, or expired administrative token.',
      code: 'INVALID_ADMIN_TOKEN',
    });
  }

  // 3. Check token revocation in Valkey / Redis
  try {
    const sessionExists = await cache.get(`admin_session:${adminPayload.adminId}`);
    if (!sessionExists) {
      return reply.status(401).send({
        success: false,
        error: 'Admin session expired or revoked. Please log in again.',
        code: 'SESSION_REVOKED',
      });
    }
  } catch {
    // If cache temporarily offline in failover, allow valid cryptographic JWT to proceed
  }

  request.admin = adminPayload;
}

/**
 * Factory for Role-Based Access Control hooks
 */
export function requireRole(...allowedRoles: AdminRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await requireAdminAuth(request, reply);
    if (reply.sent) return;

    const userRole = request.admin?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return reply.status(403).send({
        success: false,
        error: `Access Denied: Insufficient privilege. Active role '${userRole}' is not permitted. Required: [${allowedRoles.join(', ')}]`,
        code: 'INSUFFICIENT_ROLE_PRIVILEGE',
        requiredRoles: allowedRoles,
        userRole,
      });
    }
  };
}

// Granular RBAC Hooks
export const requireSuperAdmin = requireRole('SUPER_ADMIN');
export const requireTournamentOperator = requireRole('SUPER_ADMIN', 'TOURNAMENT_OPERATOR');
export const requireFinancialAuditor = requireRole('SUPER_ADMIN', 'FINANCIAL_AUDITOR');
export const requireSupportOrAbove = requireRole('SUPER_ADMIN', 'SUPPORT_AGENT', 'TOURNAMENT_OPERATOR', 'FINANCIAL_AUDITOR');
