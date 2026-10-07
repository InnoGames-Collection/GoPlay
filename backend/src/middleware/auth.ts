import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAuthToken, AuthJwtPayload } from '../utils/jwt.js';
import { cache } from '../config/cache.js';
import { requireAdminAuth } from './rbac.js';

export type AuthPayload = AuthJwtPayload & {
  id?: string;
  msisdn?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPayload;
  }
}

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      success: false,
      error: 'Authentication required. Missing or malformed Bearer token.',
    });
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyAuthToken(token) as AuthPayload | null;
  if (!payload) {
    return reply.status(401).send({
      success: false,
      error: 'Invalid or expired authentication token.',
    });
  }

  // Active session validation in Valkey / Redis (Token revocation check)
  try {
    const session = await cache.get(`session:${payload.userId}`);
    if (!session) {
      return reply.status(401).send({
        success: false,
        error: 'Session expired or revoked. Please sign in again.',
      });
    }
  } catch {
    // If cache is temporarily offline, continue gracefully with valid JWT
  }

  payload.id = payload.userId;
  payload.msisdn = payload.phone;
  request.user = payload;
}

export async function optionalAuth(request: FastifyRequest) {
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const payload = verifyAuthToken(token) as AuthPayload | null;
    if (payload) {
      payload.id = payload.userId;
      payload.msisdn = payload.phone;
      request.user = payload;
    }
  }
}

export const requireAdmin = requireAdminAuth;
export const verifyAuth = requireAuth;
export const verifyAdmin = requireAdminAuth;
