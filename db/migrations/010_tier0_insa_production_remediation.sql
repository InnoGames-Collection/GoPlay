-- ==============================================================================
-- GoPlay — Migration 010: Tier-0 INSA Compliance & End-to-End Synchronization
-- Target: PostgreSQL 16 (Port 5434 / goplay_db)
-- Enforces:
--   1. Fix subscriptions_v2 schema (add missing updated_at column for webhooks)
--   2. Authoritative daily streak reward stored procedure with atomic ledger
--   3. Authoritative sponsored ad reward procedure
--   4. Alignment of demo profiles & immutable streak states
-- ==============================================================================

BEGIN;

-- 1. Fix subscriptions_v2 schema by adding missing updated_at column
ALTER TABLE subscriptions_v2 ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Adjust user_streaks default so new users can claim their day 1 reward immediately
ALTER TABLE user_streaks ALTER COLUMN last_claimed DROP DEFAULT;

-- 3. Stored Procedure: Atomic Server-Authoritative Daily Streak Claim
CREATE OR REPLACE FUNCTION claim_daily_streak_reward_v2(
    p_user_id UUID
) RETURNS TABLE(
    success BOOLEAN,
    streak_day INT,
    coins_reward INT,
    energy_reward INT,
    new_coins BIGINT,
    new_energy INT,
    message TEXT
) AS $$
DECLARE
    v_last_claimed DATE;
    v_current_streak INT := 1;
    v_longest_streak INT := 1;
    v_day_in_cycle INT := 1;
    v_coins_award INT := 10;
    v_energy_award INT := 1;
    v_new_coins BIGINT;
    v_current_energy INT;
    v_max_energy INT;
    v_new_energy INT;
    v_idempotency_key VARCHAR(128);
BEGIN
    -- Ensure record exists in user_streaks
    INSERT INTO user_streaks (user_id, current_streak, last_claimed, longest_streak)
    VALUES (p_user_id, 1, NULL, 1)
    ON CONFLICT (user_id) DO NOTHING;

    -- Lock streak row
    SELECT current_streak, last_claimed, longest_streak
      INTO v_current_streak, v_last_claimed, v_longest_streak
      FROM user_streaks
     WHERE user_id = p_user_id
       FOR UPDATE;

    -- Check if already claimed today
    IF v_last_claimed IS NOT NULL AND v_last_claimed = CURRENT_DATE THEN
        SELECT coins, energy INTO v_new_coins, v_new_energy FROM profiles WHERE id = p_user_id;
        RETURN QUERY SELECT FALSE, v_current_streak, 0, 0, v_new_coins, v_new_energy, 'Daily streak reward already claimed for today.'::TEXT;
        RETURN;
    END IF;

    -- Calculate next streak day
    IF v_last_claimed IS NULL THEN
        v_current_streak := 1;
    ELSIF v_last_claimed = CURRENT_DATE - 1 THEN
        v_current_streak := v_current_streak + 1;
    ELSE
        -- Streak broken if missed more than 1 calendar day
        v_current_streak := 1;
    END IF;

    -- Calculate 7-day reward ladder
    v_day_in_cycle := ((v_current_streak - 1) % 7) + 1;

    CASE v_day_in_cycle
        WHEN 1 THEN v_coins_award := 10; v_energy_award := 1;
        WHEN 2 THEN v_coins_award := 15; v_energy_award := 1;
        WHEN 3 THEN v_coins_award := 20; v_energy_award := 2;
        WHEN 4 THEN v_coins_award := 25; v_energy_award := 2;
        WHEN 5 THEN v_coins_award := 35; v_energy_award := 3;
        WHEN 6 THEN v_coins_award := 50; v_energy_award := 3;
        WHEN 7 THEN v_coins_award := 100; v_energy_award := 5;
        ELSE v_coins_award := 10; v_energy_award := 1;
    END CASE;

    -- Lock and update profile balance
    SELECT coins, energy, max_energy
      INTO v_new_coins, v_current_energy, v_max_energy
      FROM profiles
     WHERE id = p_user_id
       FOR UPDATE;

    v_new_coins := COALESCE(v_new_coins, 0) + v_coins_award;
    v_new_energy := LEAST(COALESCE(v_max_energy, 5), COALESCE(v_current_energy, 5) + v_energy_award);

    UPDATE profiles
       SET coins = v_new_coins,
           energy = v_new_energy,
           updated_at = NOW()
     WHERE id = p_user_id;

    -- Update user_streaks
    UPDATE user_streaks
       SET current_streak = v_current_streak,
           last_claimed = CURRENT_DATE,
           longest_streak = GREATEST(v_longest_streak, v_current_streak)
     WHERE user_id = p_user_id;

    -- Record in immutable wallet ledger
    v_idempotency_key := 'DAILY_STREAK_' || p_user_id || '_' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    INSERT INTO wallet_transactions (
        user_id, type, coins_delta, balance_after, reference_id, description, idempotency_key
    ) VALUES (
        p_user_id, 'DAILY_REWARD', v_coins_award, v_new_coins, 
        'streak_day_' || v_day_in_cycle, 'Day ' || v_day_in_cycle || ' Streak Bonus (' || v_coins_award || ' Coins)',
        v_idempotency_key
    ) ON CONFLICT (idempotency_key) DO NOTHING;

    RETURN QUERY SELECT TRUE, v_day_in_cycle, v_coins_award, v_energy_award, v_new_coins, v_new_energy, 
        ('Day ' || v_day_in_cycle || ' Streak Claimed! +' || v_coins_award || ' Coins added.')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 4. Stored Procedure: Atomic Sponsored Ad Energy Reward
CREATE OR REPLACE FUNCTION claim_ad_sponsored_reward_v2(
    p_user_id UUID,
    p_ad_id VARCHAR(50),
    p_reward_energy INT DEFAULT 2
) RETURNS TABLE(
    success BOOLEAN,
    new_energy INT,
    message TEXT
) AS $$
DECLARE
    v_current_energy INT;
    v_max_energy INT;
    v_new_energy INT;
BEGIN
    SELECT energy, max_energy
      INTO v_current_energy, v_max_energy
      FROM profiles
     WHERE id = p_user_id
       FOR UPDATE;

    IF v_current_energy IS NULL THEN
        RETURN QUERY SELECT FALSE, 0, 'Player profile not found'::TEXT;
        RETURN;
    END IF;

    v_new_energy := LEAST(COALESCE(v_max_energy, 5), COALESCE(v_current_energy, 0) + p_reward_energy);

    UPDATE profiles
       SET energy = v_new_energy,
           updated_at = NOW()
     WHERE id = p_user_id;

    RETURN QUERY SELECT TRUE, v_new_energy, ('+' || p_reward_energy || ' Energy Restored from Sponsor Ad.')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 5. Harmonize Demo Accounts Streaks & Balances
-- 0977057270 (Demo Player) and 0911998890 (Tournament Contender)
INSERT INTO user_streaks (user_id, current_streak, last_claimed, longest_streak)
SELECT id, 1, NULL, 1 FROM profiles 
WHERE phone IN ('+251977057270', '+251911998890')
ON CONFLICT (user_id) DO UPDATE
   SET last_claimed = NULL;

COMMIT;
