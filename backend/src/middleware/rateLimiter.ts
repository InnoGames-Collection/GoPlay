import { FastifyRequest, FastifyReply } from 'fastify';
import { cache } from '../config/cache.js';

export async function rateLimiter(req: FastifyRequest, reply: FastifyReply) {
  // Rate limit by authenticated userId or normalized phone if available, fallback to IP
  const identifier = req.user?.userId || req.user?.phone || req.ip || '127.0.0.1';
  const key = `rl:goplay:${identifier}`;

  try {
    const current = await cache.incr(key);
    if (current === 1) {
      await cache.expire(key, 60);
    }
    // Allow up to 120 requests/minute for active gaming sessions
    if (current > 120) {
      reply.status(429).send({ 
        success: false, 
        error: 'Too Many Requests — rate limit exceeded. Please retry in a few moments.' 
      });
      return;
    }
  } catch (err: any) {
    // If cache is temporarily down or disconnected, allow traffic to flow gracefully
  }
}
