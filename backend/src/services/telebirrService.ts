import { env } from '../config/env.js';
import { getClient, query } from '../config/database.js';
import { cache } from '../config/cache.js';
import { computeHmacSha256, timingSafeEqual } from '../utils/crypto.js';
import { SubscriptionPlan } from '../types/domain.js';

export interface InitiatePaymentParams {
  userId: string;
  phone: string;
  amountETB: number;
  itemType: 'VIP_SUBSCRIPTION' | 'COIN_PACK' | 'ENERGY_PACK';
  itemTitle: string;
  coinsReward?: number;
  subscriptionPlan?: SubscriptionPlan;
}

export interface InitiatePaymentResult {
  orderId: string;
  checkoutUrl?: string;
  sandbox: boolean;
  status: 'PENDING' | 'SUCCESS';
  message: string;
}

export interface TelebirrWebhookPayload {
  outTradeNo: string;
  tradeStatus: string;
  totalAmount?: string;
  transactionNo?: string;
  sign?: string;
  timestamp?: string;
  [key: string]: any;
}

export const telebirrService = {
  /**
   * Verify HMAC-SHA256 signature using constant-time equality
   */
  verifyWebhookSignature(payload: Record<string, any>): boolean {
    const inboundSign = payload.sign;
    if (!inboundSign || typeof inboundSign !== 'string') {
      return false;
    }

    const appKey = env.TELEBIRR_APP_KEY || process.env.TELEBIRR_APP_KEY;
    if (!appKey) {
      console.error('[Telebirr Webhook] CRITICAL: TELEBIRR_APP_KEY is not configured.');
      return false;
    }

    // Sort all payload keys excluding 'sign' lexicographically
    const sortedParamString = Object.keys(payload)
      .filter((k) => k !== 'sign' && payload[k] !== undefined && payload[k] !== null && payload[k] !== '')
      .sort()
      .map((k) => `${k}=${payload[k]}`)
      .join('&');

    const expectedSign = computeHmacSha256(sortedParamString, appKey);
    return timingSafeEqual(inboundSign, expectedSign);
  },

  /**
   * Initiate a TeleBirr C2B checkout payment
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult> {
    const orderId = `TB_${Date.now().toString(36).toUpperCase()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const isLive = env.NODE_ENV === 'production' || env.TELEBIRR_MODE === 'live';

    if (isLive && !env.TELEBIRR_APP_KEY) {
      console.error('[Telebirr C2B] FAIL-CLOSED: TELEBIRR_APP_KEY is missing in production/live mode.');
      throw new Error('Payment gateway configuration error. Live checkout halted.');
    }

    const isSandbox = !isLive && env.TELEBIRR_MODE === 'sandbox';

    // Record initial order in PostgreSQL
    await query(
      `INSERT INTO payment_orders (
         id, user_id, method, amount_etb, item_type, item_title, coins, status, msisdn_masked
       ) VALUES ($1, $2, 'TELEBIRR', $3, $4, $5, $6, $7, $8)`,
      [
        orderId,
        params.userId,
        params.amountETB,
        params.itemType,
        params.itemTitle,
        params.coinsReward || 0,
        isSandbox ? 'SUCCESS' : 'PENDING',
        params.phone,
      ]
    );

    if (isSandbox) {
      console.log(`[Telebirr Sandbox] Order auto-credited: ${orderId} (${params.amountETB} ETB for ${params.phone})`);
      const idempotencyKey = `SANDBOX_FULFILL_${orderId}`;

      if (params.itemType === 'COIN_PACK' && params.coinsReward && params.coinsReward > 0) {
        await query(
          `SELECT credit_player_coins_v2($1, $2, $3, $4, $5)`,
          [params.userId, params.coinsReward, `TeleBirr Sandbox: ${params.itemTitle}`, orderId, idempotencyKey]
        );
      }

      if (params.itemType === 'VIP_SUBSCRIPTION' && params.subscriptionPlan) {
        const durationDays = params.subscriptionPlan === 'monthly' ? 30 : params.subscriptionPlan === 'weekly' ? 7 : 1;
        await query(
          `INSERT INTO subscriptions_v2 (user_id, msisdn, service_id, plan, is_active, auto_renew, expires_at)
           SELECT id, phone, 'srv_goplay', $1, TRUE, TRUE, NOW() + ($2 || ' days')::INTERVAL
             FROM profiles WHERE id = $3
           ON CONFLICT (msisdn, service_id) DO UPDATE
             SET is_active = TRUE, plan = EXCLUDED.plan, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
          [params.subscriptionPlan, durationDays, params.userId]
        );
      }

      await cache.del(`session:${params.userId}`);
      await cache.del(`profile:${params.userId}`);

      return {
        orderId,
        sandbox: true,
        status: 'SUCCESS',
        message: `[Sandbox] Payment of ${params.amountETB} ETB confirmed instantly for account ${params.phone}.`,
      };
    }

    // Production TeleBirr Checkout Initiation
    const payload = {
      appId: env.TELEBIRR_APP_ID,
      outTradeNo: orderId,
      totalAmount: params.amountETB.toFixed(2),
      subject: params.itemTitle,
      notifyUrl: env.TELEBIRR_NOTIFY_URL,
      returnUrl: env.TELEBIRR_RETURN_URL,
      shortCode: env.TELEBIRR_APP_ID,
      timestamp: Date.now().toString(),
    };

    const signString = Object.entries(payload)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('&');
    const signature = computeHmacSha256(signString, env.TELEBIRR_APP_KEY);

    const checkoutUrl = `${env.TELEBIRR_CHECKOUT_URL}?${signString}&sign=${signature}`;
    console.log(`[Telebirr Live] Checkout URL generated for order: ${orderId}`);

    return {
      orderId,
      checkoutUrl,
      sandbox: false,
      status: 'PENDING',
      message: 'TeleBirr payment session generated. Redirecting...',
    };
  },

  /**
   * Handle Inbound TeleBirr Payment Webhook Callback with Atomic Idempotency
   */
  async handleCallback(payload: TelebirrWebhookPayload): Promise<{ success: boolean; statusCode: number; message: string; orderId?: string }> {
    const { outTradeNo, tradeStatus, transactionNo } = payload;
    if (!outTradeNo) {
      return { success: false, statusCode: 400, message: 'Missing order identifier (outTradeNo)' };
    }

    // Strict fail-closed HMAC signature check across all environments
    const isValid = this.verifyWebhookSignature(payload);
    if (!isValid) {
      console.warn(`[Telebirr Webhook] Cryptographic signature check FAILED for order: ${outTradeNo}`);
      return { success: false, statusCode: 401, message: 'Invalid cryptographic signature' };
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      // Row-level lock on payment order
      const orderRes = await client.query(
        `SELECT id, user_id, amount_etb, item_type, item_title, coins, status 
           FROM payment_orders 
          WHERE id = $1 
            FOR UPDATE`,
        [outTradeNo]
      );

      if (orderRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return { success: false, statusCode: 404, message: 'Order not found' };
      }

      const order = orderRes.rows[0];

      // Idempotency: if already fulfilled, return success immediately
      if (order.status === 'SUCCESS') {
        await client.query('COMMIT');
        return { success: true, statusCode: 200, message: 'Order already fulfilled (Idempotent)', orderId: outTradeNo };
      }

      const isCompleted = tradeStatus === 'Completed' || tradeStatus === 'SUCCESS' || tradeStatus === 'TRADE_SUCCESS';

      if (!isCompleted) {
        await client.query(
          `UPDATE payment_orders 
              SET status = 'FAILED', error_message = $1, provider_ref = $2
            WHERE id = $3`,
          [`Payment not completed. Carrier status: ${tradeStatus}`, transactionNo || null, outTradeNo]
        );
        await client.query('COMMIT');
        return { success: false, statusCode: 200, message: `Payment recorded with status: ${tradeStatus}` };
      }

      // Mark order SUCCESS
      await client.query(
        `UPDATE payment_orders 
            SET status = 'SUCCESS', paid_at = NOW(), provider_ref = $1, error_message = NULL
          WHERE id = $2`,
        [transactionNo || 'TB_LIVE_REF', outTradeNo]
      );

      const idempotencyKey = `PAY_FULFILL_${outTradeNo}`;

      // Fulfill benefits based on item_type
      if (order.item_type === 'COIN_PACK' && Number(order.coins) > 0) {
        const coinAmount = parseInt(order.coins, 10);
        await client.query(
          `SELECT credit_player_coins_v2($1, $2, $3, $4, $5)`,
          [order.user_id, coinAmount, `TeleBirr Purchase: ${order.item_title}`, outTradeNo, idempotencyKey]
        );
      } else if (order.item_type === 'VIP_SUBSCRIPTION') {
        const titleLower = (order.item_title || '').toLowerCase();
        const plan: SubscriptionPlan = titleLower.includes('monthly')
          ? 'monthly'
          : titleLower.includes('weekly')
          ? 'weekly'
          : 'daily';
        const durationDays = plan === 'monthly' ? 30 : plan === 'weekly' ? 7 : 1;

        await client.query(
          `INSERT INTO subscriptions_v2 (user_id, msisdn, service_id, plan, is_active, auto_renew, expires_at)
           SELECT id, phone, 'srv_goplay', $1, TRUE, TRUE, NOW() + ($2 || ' days')::INTERVAL
             FROM profiles WHERE id = $3
           ON CONFLICT (msisdn, service_id) DO UPDATE
             SET is_active = TRUE, plan = EXCLUDED.plan, expires_at = EXCLUDED.expires_at, updated_at = NOW()`,
          [plan, durationDays, order.user_id]
        );
      }

      await client.query('COMMIT');

      // Invalidate cache
      await cache.del(`session:${order.user_id}`);
      await cache.del(`profile:${order.user_id}`);

      console.log(`[Telebirr Webhook] Order ${outTradeNo} successfully fulfilled for user ${order.user_id}`);
      return { success: true, statusCode: 200, message: 'Payment successfully fulfilled', orderId: outTradeNo };
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('[Telebirr Webhook Error] Processing aborted:', err);
      return { success: false, statusCode: 500, message: 'Internal transaction error' };
    } finally {
      client.release();
    }
  },

  /**
   * Disburse prize money to player via TeleBirr B2C API
   */
  async disburseReward(phone: string, amountETB: number, rewardId: string): Promise<{ success: boolean; ref?: string; error?: string }> {
    const isSandbox = env.TELEBIRR_MODE === 'sandbox' || !env.TELEBIRR_APP_KEY;
    const ref = `DISB_TB_${Date.now().toString(36).toUpperCase()}`;

    if (amountETB <= 0) {
      return { success: true, ref: 'ZERO_AMOUNT_NOOP' };
    }

    if (isSandbox) {
      console.log(`[Telebirr Sandbox] Reward B2C transfer disbursed: ${amountETB} ETB to ${phone} (Ref: ${ref})`);
      return { success: true, ref };
    }

    try {
      const b2cPayload = {
        appId: env.TELEBIRR_APP_ID,
        phone,
        amount: amountETB.toFixed(2),
        reference: ref,
        rewardId,
        timestamp: Date.now().toString(),
      };

      const signString = Object.entries(b2cPayload)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      const signature = computeHmacSha256(signString, env.TELEBIRR_APP_KEY);

      const res = await fetch(`${env.TELEBIRR_CHECKOUT_URL}/b2c/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...b2cPayload, sign: signature }),
      });

      const data = await res.json() as any;
      if (res.ok && data.code === 200) {
        return { success: true, ref: data.transactionNo || ref };
      }
      return { success: false, error: data.message || 'Telebirr B2C rejected transfer' };
    } catch (err: any) {
      console.error('[Telebirr B2C Error]', { err, phone, rewardId });
      return { success: false, error: err.message || 'Network error reaching Telebirr B2C' };
    }
  },
};
