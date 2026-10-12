import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authService } from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';
import { cache } from '../config/cache.js';
import { query } from '../config/database.js';
import { generateRandomOtp } from '../utils/crypto.js';
import { normalizeEthiopianPhone } from '../utils/msisdn.js';
import { env } from '../config/env.js';

const TelebirrLoginSchema = z.object({
  phoneNumber: z.string().optional(),
  token: z.string().optional(),
});

const RequestOtpSchema = z.object({
  phoneNumber: z.string().min(8),
});

const VerifyOtpSchema = z.object({
  phoneNumber: z.string().min(8),
  otp: z.string().min(4).max(8),
});

const AdRewardSchema = z.object({
  adId: z.string().optional(),
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

  // Request SMS OTP for mobile authentication
  fastify.post('/request-otp', async (request, reply) => {
    const parseResult = RequestOtpSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: 'Valid Ethiopian mobile number required.',
        errors: parseResult.error.format(),
      });
    }

    const { phoneNumber } = parseResult.data;
    const norm = normalizeEthiopianPhone(phoneNumber);
    if (!norm.isValid) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid Ethiopian phone number. Please enter a valid MSISDN starting with 09 or 07.',
      });
    }

    const isDemo = norm.local === env.DEMO_MSISDN_VIP || norm.local === env.DEMO_MSISDN_FREE;
    const otp = isDemo ? '123456' : generateRandomOtp(6);

    try {
      await cache.set(`otp:${norm.local}`, otp, 'EX', 300); // 5 min TTL
    } catch {
      // Continue if cache offline
    }

    console.log(`[GoPlay OTP] Code generated for ${norm.localMasked}: ${isDemo ? otp : '******'}`);

    return reply.send({
      success: true,
      message: `Verification code sent to ${norm.localMasked}.`,
      isDemo,
      demoOtp: isDemo ? otp : undefined,
    });
  });

  // Verify SMS OTP and complete login
  fastify.post('/verify-otp', async (request, reply) => {
    const parseResult = VerifyOtpSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid verification payload',
        errors: parseResult.error.format(),
      });
    }

    const { phoneNumber, otp } = parseResult.data;
    const norm = normalizeEthiopianPhone(phoneNumber);
    if (!norm.isValid) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid Ethiopian phone format.',
      });
    }

    const isDemo = norm.local === env.DEMO_MSISDN_VIP || norm.local === env.DEMO_MSISDN_FREE;
    let isValidOtp = false;

    try {
      const cachedOtp = await cache.get(`otp:${norm.local}`);
      if (cachedOtp && cachedOtp === otp.trim()) {
        isValidOtp = true;
        await cache.del(`otp:${norm.local}`);
      }
    } catch {
      // Fallback if cache offline
    }

    // Demo accounts accept deterministic PIN 123456
    if (isDemo && otp.trim() === '123456') {
      isValidOtp = true;
    }

    if (!isValidOtp) {
      return reply.status(400).send({
        success: false,
        message: 'Invalid or expired 6-digit verification code.',
      });
    }

    // Authenticate and issue authoritative tokens
    const result = await authService.loginWithTeleBirr(norm.local);
    if (!result.success) {
      return reply.status(400).send(result);
    }

    return reply.send(result);
  });

  // Authoritative Daily Login Streak Claim
  fastify.post('/streak/claim', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;

    try {
      const res = await query(
        `SELECT success, streak_day, coins_reward, energy_reward, new_coins, new_energy, message
           FROM claim_daily_streak_reward_v2($1)`,
        [userId]
      );

      const row = res.rows[0];
      if (!row || !row.success) {
        return reply.status(400).send({
          success: false,
          message: row?.message || 'Daily streak already claimed today.',
        });
      }

      await cache.del(`profile:${userId}`);
      const freshProfile = await authService.getProfile(userId);

      return reply.send({
        success: true,
        streakDay: row.streak_day,
        coinsReward: row.coins_reward,
        energyReward: row.energy_reward,
        message: row.message,
        profile: freshProfile,
      });
    } catch (err: any) {
      console.error('[Streak Claim DB Error]', err);
      return reply.status(500).send({
        success: false,
        message: 'Database error processing streak reward.',
      });
    }
  });

  // Authoritative Sponsored Ad Energy Refill
  fastify.post('/ad-reward', { preHandler: [requireAuth] }, async (request, reply) => {
    const userId = request.user!.userId;
    const body = (request.body || {}) as { adId?: string };
    const adId = body.adId || 'ad_telebirr_superapp';

    try {
      const res = await query(
        `SELECT success, new_energy, message
           FROM claim_ad_sponsored_reward_v2($1, $2, 2)`,
        [userId, adId]
      );

      const row = res.rows[0];
      if (!row || !row.success) {
        return reply.status(400).send({
          success: false,
          message: row?.message || 'Failed to claim sponsor reward.',
        });
      }

      await cache.del(`profile:${userId}`);
      const freshProfile = await authService.getProfile(userId);

      return reply.send({
        success: true,
        newEnergy: row.new_energy,
        message: row.message,
        profile: freshProfile,
      });
    } catch (err: any) {
      console.error('[Ad Reward DB Error]', err);
      return reply.status(500).send({
        success: false,
        message: 'Failed to record sponsor reward.',
      });
    }
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
