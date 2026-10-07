import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { telebirrService } from '../services/telebirrService.js';
import { query } from '../config/database.js';
import { SubscriptionPlan } from '../types/domain.js';

interface ValidCatalogItem {
  itemType: 'COIN_PACK' | 'VIP_SUBSCRIPTION' | 'ENERGY_PACK';
  amountETB: number;
  itemTitle: string;
  coinsReward?: number;
  subscriptionPlan?: SubscriptionPlan;
}

const PRICING_CATALOG: Record<string, ValidCatalogItem> = {
  COIN_PACK_10: {
    itemType: 'COIN_PACK',
    amountETB: 10,
    itemTitle: '10 GoPlay Coins (10 ETB)',
    coinsReward: 10,
  },
  COIN_PACK_25: {
    itemType: 'COIN_PACK',
    amountETB: 25,
    itemTitle: '25 GoPlay Coins (25 ETB)',
    coinsReward: 25,
  },
  COIN_PACK_50: {
    itemType: 'COIN_PACK',
    amountETB: 50,
    itemTitle: '50 GoPlay Coins (50 ETB)',
    coinsReward: 50,
  },
  PLAN_DAILY: {
    itemType: 'VIP_SUBSCRIPTION',
    amountETB: 3,
    itemTitle: 'GoPlay Daily VIP Pass (3 ETB)',
    subscriptionPlan: 'daily',
  },
  PLAN_WEEKLY: {
    itemType: 'VIP_SUBSCRIPTION',
    amountETB: 10,
    itemTitle: 'GoPlay Weekly VIP Pass (10 ETB)',
    subscriptionPlan: 'weekly',
  },
  PLAN_MONTHLY: {
    itemType: 'VIP_SUBSCRIPTION',
    amountETB: 30,
    itemTitle: 'GoPlay Monthly VIP Pass (30 ETB)',
    subscriptionPlan: 'monthly',
  },
  ENERGY_PACK_5: {
    itemType: 'ENERGY_PACK',
    amountETB: 5,
    itemTitle: '5 Energy Hearts Refill (5 ETB)',
  },
};

const WebhookSchema = z.object({
  outTradeNo: z.string().min(5),
  tradeStatus: z.string().min(1),
  totalAmount: z.string().optional(),
  transactionNo: z.string().optional(),
  sign: z.string().optional(),
  timestamp: z.string().optional(),
}).passthrough();

const ProcessPaymentSchema = z.object({
  packageId: z.enum([
    'COIN_PACK_10',
    'COIN_PACK_25',
    'COIN_PACK_50',
    'PLAN_DAILY',
    'PLAN_WEEKLY',
    'PLAN_MONTHLY',
    'ENERGY_PACK_5',
  ]).optional(),
  itemType: z.enum(['VIP_SUBSCRIPTION', 'COIN_PACK', 'ENERGY_PACK']).optional(),
  plan: z.enum(['daily', 'weekly', 'monthly']).optional(),
  coinsAmount: z.number().int().positive().optional(),
});

export async function paymentRoutes(fastify: FastifyInstance) {
  // Public Telebirr Webhook Callback
  fastify.post('/webhook', async (request, reply) => {
    const parseResult = WebhookSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        code: 400,
        message: 'Invalid webhook schema',
        errors: parseResult.error.format(),
      });
    }

    const result = await telebirrService.handleCallback(parseResult.data);
    return reply.status(result.statusCode).send({
      code: result.success ? 0 : result.statusCode,
      message: result.message,
      orderId: result.orderId,
    });
  });

  // Authenticated User Payment Routes
  fastify.register(async (authScope) => {
    authScope.addHook('preHandler', requireAuth);

    // Process / Initiate payment strictly via Telebirr
    authScope.post('/process', async (request, reply) => {
      const parseResult = ProcessPaymentSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid purchase item parameters.',
          errors: parseResult.error.format(),
        });
      }

      const userId = request.user!.userId;
      const phone = request.user!.phone;
      const body = parseResult.data;

      let catalogItem: ValidCatalogItem | undefined;

      if (body.packageId && PRICING_CATALOG[body.packageId]) {
        catalogItem = PRICING_CATALOG[body.packageId];
      } else if (body.itemType === 'COIN_PACK') {
        if (body.coinsAmount === 50) catalogItem = PRICING_CATALOG.COIN_PACK_50;
        else if (body.coinsAmount === 25) catalogItem = PRICING_CATALOG.COIN_PACK_25;
        else catalogItem = PRICING_CATALOG.COIN_PACK_10;
      } else if (body.itemType === 'ENERGY_PACK') {
        catalogItem = PRICING_CATALOG.ENERGY_PACK_5;
      } else if (body.itemType === 'VIP_SUBSCRIPTION') {
        if (body.plan === 'daily') catalogItem = PRICING_CATALOG.PLAN_DAILY;
        else if (body.plan === 'weekly') catalogItem = PRICING_CATALOG.PLAN_WEEKLY;
        else if (body.plan === 'monthly') catalogItem = PRICING_CATALOG.PLAN_MONTHLY;
      }

      if (!catalogItem) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid purchase item. Please select a valid TeleBirr coin pack or VIP pass.',
        });
      }

      try {
        const result = await telebirrService.initiatePayment({
          userId,
          phone,
          amountETB: catalogItem.amountETB,
          itemType: catalogItem.itemType,
          itemTitle: catalogItem.itemTitle,
          coinsReward: catalogItem.coinsReward,
          subscriptionPlan: catalogItem.subscriptionPlan,
        });

        return reply.send({
          status: result.status,
          transaction: {
            transactionId: result.orderId,
            method: 'TELEBIRR',
            amountETB: catalogItem.amountETB,
            itemType: catalogItem.itemType,
            itemTitle: catalogItem.itemTitle,
            status: result.status,
            timestamp: new Date().toISOString(),
          },
          checkoutUrl: result.checkoutUrl,
          message: result.message,
        });
      } catch (err: any) {
        return reply.status(500).send({
          success: false,
          message: err.message || 'Payment initiation failure',
        });
      }
    });

    // Payment history
    authScope.get('/history', async (request, reply) => {
      const userId = request.user!.userId;
      const res = await query(
        `SELECT id, method, amount_etb, item_type, item_title, status, created_at, msisdn_masked
           FROM payment_orders
          WHERE user_id = $1
          ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );

      return reply.send(
        res.rows.map((r: any) => ({
          transactionId: r.id,
          method: r.method,
          amountETB: parseFloat(r.amount_etb),
          itemType: r.item_type,
          itemTitle: r.item_title,
          status: r.status,
          timestamp: r.created_at,
          msisdnMasked: r.msisdn_masked,
        }))
      );
    });

    // Wallet transaction ledger (Credits, debits, tournament fees)
    authScope.get('/ledger', async (request, reply) => {
      const userId = request.user!.userId;
      const res = await query(
        `SELECT id, type, coins_delta, balance_after, reference_id, description, created_at
           FROM wallet_transactions
          WHERE user_id = $1
          ORDER BY created_at DESC LIMIT 50`,
        [userId]
      );

      return reply.send(
        res.rows.map((r: any) => ({
          id: r.id,
          type: r.type,
          coinsDelta: parseInt(r.coins_delta, 10),
          balanceAfter: parseInt(r.balance_after, 10),
          referenceId: r.reference_id,
          description: r.description,
          timestamp: r.created_at,
        }))
      );
    });
  });
}
