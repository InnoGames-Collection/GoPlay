import { FastifyRequest, FastifyReply } from 'fastify';
import { cache } from '../config/cache.js';

export async function rateLimiter(req: FastifyRequest, reply: FastifyReply) {
  // Rate limit by authenticated userId, phone, telebirr client ID header, or IP
  const telebirrClientId = req.headers['x-telebirr-client-id'] as string | undefined;
  const identifier = req.user?.userId || req.user?.phone || telebirrClientId || req.ip || '127.0.0.1';
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
