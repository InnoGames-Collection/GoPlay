import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { cache } from '../config/cache.js';

const TelebirrLoginSchema = z.object({
  phoneNumber: z.string().optional(),
  token: z.string().optional(),
});

export async function authRoutes(fastify: FastifyInstance) {
  // TeleBirr SuperApp Direct Connect Single-Sign-On
  fastify.post('/telebirr-login', async (request, reply) => {
    const parseResult = TelebirrLoginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid request payload',
        errors: parseResult.error.format(),
      });
    }

    const { phoneNumber, token } = parseResult.data;
    const result = await authService.loginWithTeleBirr(phoneNumber, token);
    if (!result.success) {
      return reply.status(400).send(result);
    }
    return reply.send(result);
  });

  // Get current authenticated user profile
  fastify.get('/me', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    const profile = await authService.getProfile(userId);
    if (!profile) {
      return reply.status(404).send({ success: false, message: 'Profile not found' });
    }
    return reply.send({ success: true, profile });
  });

  // Sign out / invalidate session in Valkey / Redis
  fastify.post('/logout', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    try {
      await cache.del(`session:${userId}`);
    } catch {
      // Ignore cache deletion error
    }
    return reply.send({ success: true, message: 'Signed out successfully' });
  });
}
