-- ==============================================================================
-- GoPlay — Migration 003: Enterprise Remediation & Relational Unification
-- Target: PostgreSQL 16
-- Fixes: Wallet transaction ledger, atomic fee deductions, tournament settlement,
--        anti-cheat telemetry columns, and performance indexing.
-- ==============================================================================

BEGIN;

-- 1. Ensure Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Harmonize profiles & players (unify on 'profiles')
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS msisdn VARCHAR(20);
UPDATE profiles SET msisdn = phone WHERE msisdn IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_msisdn ON profiles(msisdn);

-- 3. Strict Coin Balance Constraints
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS chk_profiles_coins_non_negative;
ALTER TABLE profiles 
    ADD CONSTRAINT chk_profiles_coins_non_negative CHECK (coins >= 0);

-- 4. Immutable Wallet Transactions Audit Ledger
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'TELEBIRR_PURCHASE', 
        'TOURNAMENT_ENTRY_FEE', 
        'TOURNAMENT_PRIZE_PAYOUT', 
        'DAILY_REWARD', 
        'ADMIN_ADJUSTMENT'
    )),
    coins_delta BIGINT NOT NULL,
    balance_after BIGINT NOT NULL CHECK (balance_after >= 0),
    reference_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_ref ON wallet_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_idempotency ON wallet_transactions(idempotency_key);

-- 5. Subscriptions Schema Upgrade
CREATE TABLE IF NOT EXISTS subscriptions_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    msisdn VARCHAR(20) NOT NULL,
    service_id VARCHAR(50) NOT NULL DEFAULT 'srv_goplay',
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    UNIQUE(msisdn, service_id)
);

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        INSERT INTO subscriptions_v2 (user_id, msisdn, service_id, plan, is_active, auto_renew, activated_at, expires_at)
        SELECT p.id, s.msisdn, COALESCE(s.service_id, 'srv_goplay'), 'daily', TRUE, TRUE, NOW(), NOW() + INTERVAL '1 day'
        FROM subscriptions s
        JOIN profiles p ON p.phone = s.msisdn
        ON CONFLICT (msisdn, service_id) DO NOTHING;
    END IF;
END $$;

-- 6. Upgrade Game Sessions for Server-Authoritative Anti-Cheat
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS tournament_id VARCHAR(50) REFERENCES tournaments(id) ON DELETE SET NULL;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS server_duration_sec NUMERIC(10,2);
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS max_velocity NUMERIC(10,2);
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE game_sessions ADD COLUMN IF NOT EXISTS client_telemetry JSONB;

CREATE INDEX IF NOT EXISTS idx_game_sessions_token ON game_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_active ON game_sessions(user_id, game_id, is_finalized);
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(session_id) WHERE is_finalized = FALSE;

-- 7. Upgrade Tournament Entries with Composite Indexes & Foreign Keys
ALTER TABLE tournament_entries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE tournament_entries ADD COLUMN IF NOT EXISTS attempts_count INT NOT NULL DEFAULT 1;
ALTER TABLE tournament_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill user_id where possible
UPDATE tournament_entries te
   SET user_id = p.id
  FROM profiles p
 WHERE te.user_id IS NULL AND te.player_msisdn = p.phone;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_entries_user ON tournament_entries(tournament_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tournament_entries_leaderboard ON tournament_entries(tournament_id, score DESC, submitted_at ASC);

-- 8. Tournament Prize Payouts & Settlement Ledger
CREATE TABLE IF NOT EXISTS tournament_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    msisdn VARCHAR(20) NOT NULL,
    rank INT NOT NULL,
    prize_etb NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    prize_coins INT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'DISBURSED', 'FAILED')),
    telebirr_b2c_ref VARCHAR(100),
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_tourn_payouts_tourn ON tournament_payouts(tournament_id, rank);
CREATE INDEX IF NOT EXISTS idx_tourn_payouts_user ON tournament_payouts(user_id, created_at DESC);

-- 9. Stored Procedure: Atomic Tournament Entry Fee Deduction
CREATE OR REPLACE FUNCTION deduct_tournament_fee(
    p_user_id UUID,
    p_tournament_id VARCHAR(50),
    p_fee INT,
    p_idempotency_key VARCHAR(128)
) RETURNS TABLE(success BOOLEAN, new_balance BIGINT, message TEXT) AS $$
DECLARE
    v_current_coins BIGINT;
    v_new_coins BIGINT;
BEGIN
    -- Idempotency check
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE idempotency_key = p_idempotency_key) THEN
        SELECT coins INTO v_current_coins FROM profiles WHERE id = p_user_id;
        RETURN QUERY SELECT TRUE, v_current_coins, 'Transaction already settled'::TEXT;
        RETURN;
    END IF;

    -- Row-lock profile
    SELECT coins INTO v_current_coins 
      FROM profiles 
     WHERE id = p_user_id 
       FOR UPDATE;

    IF v_current_coins IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 'User profile not found'::TEXT;
        RETURN;
    END IF;

    IF v_current_coins < p_fee THEN
        RETURN QUERY SELECT FALSE, v_current_coins, 'Insufficient coin balance'::TEXT;
        RETURN;
    END IF;

    -- Deduct balance
    v_new_coins := v_current_coins - p_fee;
    UPDATE profiles 
       SET coins = v_new_coins, updated_at = NOW() 
     WHERE id = p_user_id;

    -- Record immutable ledger row
    INSERT INTO wallet_transactions (
        user_id, type, coins_delta, balance_after, reference_id, description, idempotency_key
    ) VALUES (
        p_user_id, 'TOURNAMENT_ENTRY_FEE', -p_fee, v_new_coins, p_tournament_id, 
        'Tournament Buy-in Fee (' || p_fee || ' Coins)', p_idempotency_key
    );

    RETURN QUERY SELECT TRUE, v_new_coins, 'Tournament entry fee deducted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 10. Stored Procedure: Atomic Credit Player Coins
CREATE OR REPLACE FUNCTION credit_player_coins(
    p_user_id UUID,
    p_coins INT,
    p_reason VARCHAR(100),
    p_reference_id VARCHAR(100),
    p_idempotency_key VARCHAR(128)
) RETURNS BIGINT AS $$
DECLARE
    v_new_coins BIGINT;
BEGIN
    -- Idempotency check
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE idempotency_key = p_idempotency_key) THEN
        SELECT coins INTO v_new_coins FROM profiles WHERE id = p_user_id;
        RETURN v_new_coins;
    END IF;

    -- Lock and update
    UPDATE profiles 
       SET coins = coins + p_coins, updated_at = NOW()
     WHERE id = p_user_id
    RETURNING coins INTO v_new_coins;

    INSERT INTO wallet_transactions (
        user_id, type, coins_delta, balance_after, reference_id, description, idempotency_key
    ) VALUES (
        p_user_id, 'TELEBIRR_PURCHASE', p_coins, v_new_coins, p_reference_id, p_reason, p_idempotency_key
    );

    RETURN v_new_coins;
END;
$$ LANGUAGE plpgsql;

-- 11. Upgraded apply_coins function to maintain backwards compatibility while ensuring ledger integrity
CREATE OR REPLACE FUNCTION apply_coins(
    p_user_id UUID,
    p_delta INT,
    p_reason VARCHAR(128),
    p_ref_id VARCHAR(64)
) RETURNS INT AS $$
DECLARE
    v_new_coins BIGINT;
    v_idempotency_key VARCHAR(128);
BEGIN
    v_idempotency_key := 'LEGACY_APPLY_' || p_ref_id || '_' || gen_random_uuid();
    
    IF p_delta >= 0 THEN
        v_new_coins := credit_player_coins(p_user_id, p_delta, p_reason, p_ref_id, v_idempotency_key);
        RETURN v_new_coins::INT;
    ELSE
        -- Deduction with strict balance check
        UPDATE profiles
           SET coins = coins + p_delta, updated_at = NOW()
         WHERE id = p_user_id AND coins >= ABS(p_delta)
        RETURNING coins INTO v_new_coins;

        IF v_new_coins IS NULL THEN
            RAISE EXCEPTION 'Insufficient coin balance for deduction';
        END IF;

        INSERT INTO wallet_transactions (
            user_id, type, coins_delta, balance_after, reference_id, description, idempotency_key
        ) VALUES (
            p_user_id, 'ADMIN_ADJUSTMENT', p_delta, v_new_coins, p_ref_id, p_reason, v_idempotency_key
        );

        RETURN v_new_coins::INT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 12. Ensure all 12 canonical games exist in games table
INSERT INTO games (game_id, title, category, is_free, requires_coins, is_enabled, max_score_per_sec, max_score)
VALUES
    ('crazy-colors', 'Crazy Color', 'arcade', false, true, true, 25, 5000),
    ('juicy-match', 'Candy Juicy', 'casual', true, false, true, 80, 50000),
    ('emoji-fun', 'Emoji Fun', 'casual', true, false, true, 35, 3000),
    ('pop-piano', 'Pop Piano', 'music', true, false, true, 100, 30000),
    ('world-legends', 'Word Legend', 'knowledge', true, false, true, 30, 5000),
    ('candy-blast', 'Candy Crush', 'casual', true, false, true, 80, 50000),
    ('soccer-shooter', 'Soccer Shooter', 'sports', true, false, true, 50, 5000),
    ('dama', 'Dama', 'board', true, false, true, 50, 10000),
    ('button-soccer', 'Button Soccer', 'sports', true, false, true, 20, 1000),
    ('soccer-ping-pong', 'Soccer Ping Pong', 'sports', true, false, true, 30, 2500),
    ('bubble-sort', 'Bubble Sort', 'puzzle', true, false, true, 40, 4000),
    ('color-tap-sprint', 'Color Tap Sprint', 'arcade', true, false, true, 40, 5000)
ON CONFLICT (game_id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    is_free = EXCLUDED.is_free,
    requires_coins = EXCLUDED.requires_coins,
    is_enabled = EXCLUDED.is_enabled,
    max_score_per_sec = EXCLUDED.max_score_per_sec,
    max_score = EXCLUDED.max_score;

-- 13. Ensure Flagship Crazy Color Tournament is Active
INSERT INTO tournaments (id, title, game_id, start_date, end_date, prize_pool_etb, status)
VALUES
    ('tourn_crazy_colors_01', 'Crazy Color Championship', 'crazy-colors', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 25000, 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
    prize_pool_etb = 25000,
    status = 'ACTIVE';

COMMIT;
