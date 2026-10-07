-- ==============================================================================
-- GoPlay — Migration 004: Tier-0 Enterprise Production Hardening
-- Target: PostgreSQL 16 (Port 5434)
-- Enforces: Strict constraints, deterministic idempotency, entry fees, and
--           two-phase payout settlement state machine.
-- ==============================================================================

BEGIN;

-- 1. Extend Games Catalog with Explicit Entry Fee & Verification Constraints
ALTER TABLE games ADD COLUMN IF NOT EXISTS entry_fee_coins INT NOT NULL DEFAULT 0 CHECK (entry_fee_coins >= 0);
ALTER TABLE games ADD COLUMN IF NOT EXISTS min_duration_sec NUMERIC(6,2) NOT NULL DEFAULT 3.00;

-- Update canonical rules for all 12 games in GoPlay
UPDATE games SET entry_fee_coins = 2, requires_coins = TRUE, min_duration_sec = 3.00 WHERE game_id = 'crazy-colors';
UPDATE games SET entry_fee_coins = 0, requires_coins = FALSE, min_duration_sec = 3.00 WHERE game_id != 'crazy-colors';

-- 2. Enhanced Wallet Transactions Ledger Constraint
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS chk_wallet_tx_type;
ALTER TABLE wallet_transactions ADD CONSTRAINT chk_wallet_tx_type CHECK (type IN (
    'TELEBIRR_PURCHASE', 
    'TOURNAMENT_ENTRY_FEE', 
    'TOURNAMENT_PRIZE_PAYOUT', 
    'DAILY_REWARD', 
    'ADMIN_ADJUSTMENT',
    'REFUND'
));

-- 3. Strict Non-Negative Constraints on Profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_coins_positive;
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_coins_positive CHECK (coins >= 0);

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_energy_positive;
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_energy_positive CHECK (energy >= 0);

-- 4. Tournament Payouts State Machine Hardening
ALTER TABLE tournament_payouts DROP CONSTRAINT IF EXISTS chk_payout_status;
ALTER TABLE tournament_payouts ADD CONSTRAINT chk_payout_status CHECK (
    status IN ('PENDING', 'PROCESSING', 'DISBURSED', 'FAILED', 'REVERSED')
);

CREATE INDEX IF NOT EXISTS idx_payouts_tourn_status ON tournament_payouts(tournament_id, status);

-- 5. Stored Procedure: Deterministic & Atomic Tournament Fee Deduction
CREATE OR REPLACE FUNCTION deduct_tournament_fee_v2(
    p_user_id UUID,
    p_tournament_id VARCHAR(50),
    p_idempotency_key VARCHAR(128)
) RETURNS TABLE(success BOOLEAN, new_balance BIGINT, attempts_left INT, message TEXT) AS $$
DECLARE
    v_current_coins BIGINT;
    v_new_coins BIGINT;
    v_entry_fee INT;
    v_tourn_status VARCHAR(20);
    v_attempts INT := 0;
BEGIN
    -- Check tournament validity
    SELECT status INTO v_tourn_status 
      FROM tournaments 
     WHERE id = p_tournament_id AND end_date > NOW();

    IF v_tourn_status IS NULL OR v_tourn_status != 'ACTIVE' THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Tournament is inactive or expired'::TEXT;
        RETURN;
    END IF;

    -- Look up entry fee for tournament game
    SELECT COALESCE(g.entry_fee_coins, 2) INTO v_entry_fee
      FROM tournaments t
      JOIN games g ON t.game_id = g.game_id
     WHERE t.id = p_tournament_id;

    IF v_entry_fee IS NULL THEN
        v_entry_fee := 2;
    END IF;

    -- Strict Idempotency: Return existing balance if key already processed
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE idempotency_key = p_idempotency_key) THEN
        SELECT coins INTO v_current_coins FROM profiles WHERE id = p_user_id;
        SELECT COALESCE(attempts_count, 1) INTO v_attempts 
          FROM tournament_entries 
         WHERE tournament_id = p_tournament_id AND user_id = p_user_id;
        RETURN QUERY SELECT TRUE, v_current_coins, GREATEST(0, 3 - v_attempts), 'Entry already settled (Idempotent)'::TEXT;
        RETURN;
    END IF;

    -- Row-lock profile
    SELECT coins INTO v_current_coins 
      FROM profiles 
     WHERE id = p_user_id 
       FOR UPDATE;

    IF v_current_coins IS NULL THEN
        RETURN QUERY SELECT FALSE, 0::BIGINT, 0, 'Player profile not found'::TEXT;
        RETURN;
    END IF;

    IF v_current_coins < v_entry_fee THEN
        RETURN QUERY SELECT FALSE, v_current_coins, 0, 'Insufficient GoPlay Coins'::TEXT;
        RETURN;
    END IF;

    -- Deduct balance atomically
    v_new_coins := v_current_coins - v_entry_fee;
    UPDATE profiles 
       SET coins = v_new_coins, updated_at = NOW() 
     WHERE id = p_user_id;

    -- Record immutable ledger row
    INSERT INTO wallet_transactions (
        user_id, type, coins_delta, balance_after, reference_id, description, idempotency_key
    ) VALUES (
        p_user_id, 'TOURNAMENT_ENTRY_FEE', -v_entry_fee, v_new_coins, p_tournament_id, 
        'Tournament Entry Fee (' || v_entry_fee || ' Coins)', p_idempotency_key
    );

    -- Increment attempts in tournament_entries
    INSERT INTO tournament_entries (
        tournament_id, user_id, player_msisdn, masked_msisdn, score, attempts_count, submitted_at
    ) 
    SELECT p_tournament_id, p_user_id, p.phone, 
           '0' || SUBSTRING(p.phone FROM 5 FOR 2) || '*****' || SUBSTRING(p.phone FROM LENGTH(p.phone)-2),
           0, 1, NOW()
      FROM profiles p WHERE p.id = p_user_id
    ON CONFLICT (tournament_id, user_id) DO UPDATE
       SET attempts_count = tournament_entries.attempts_count + 1;

    SELECT attempts_count INTO v_attempts 
      FROM tournament_entries 
     WHERE tournament_id = p_tournament_id AND user_id = p_user_id;

    RETURN QUERY SELECT TRUE, v_new_coins, GREATEST(0, 3 - v_attempts), 'Tournament entry confirmed'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. Stored Procedure: Atomic Credit Player Coins
CREATE OR REPLACE FUNCTION credit_player_coins_v2(
    p_user_id UUID,
    p_coins INT,
    p_reason VARCHAR(100),
    p_reference_id VARCHAR(100),
    p_idempotency_key VARCHAR(128)
) RETURNS BIGINT AS $$
DECLARE
    v_new_coins BIGINT;
BEGIN
    -- Strict Idempotency Check
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE idempotency_key = p_idempotency_key) THEN
        SELECT coins INTO v_new_coins FROM profiles WHERE id = p_user_id;
        RETURN v_new_coins;
    END IF;

    -- Lock and increment
    UPDATE profiles 
       SET coins = coins + p_coins, updated_at = NOW()
     WHERE id = p_user_id
    RETURNING coins INTO v_new_coins;

    IF v_new_coins IS NULL THEN
        RAISE EXCEPTION 'Target user profile not found for credit: %', p_user_id;
    END IF;

    -- Write immutable audit ledger
    INSERT INTO wallet_transactions (
        user_id, type, coins_delta, balance_after, reference_id, description, idempotency_key
    ) VALUES (
        p_user_id, 'TELEBIRR_PURCHASE', p_coins, v_new_coins, p_reference_id, p_reason, p_idempotency_key
    );

    RETURN v_new_coins;
END;
$$ LANGUAGE plpgsql;

-- 7. High-Performance Indexing
CREATE INDEX IF NOT EXISTS idx_tournament_entries_leaderboard 
  ON tournament_entries(tournament_id, score DESC, submitted_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_idempotency 
  ON wallet_transactions(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_payment_orders_user_created 
  ON payment_orders(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_token_active 
  ON game_sessions(session_token) WHERE is_finalized = FALSE;

COMMIT;
