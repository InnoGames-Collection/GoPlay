-- ==============================================================================
-- GoPlay — Migration 007: Tier-0 Settlement & Index Hardening
-- Target: PostgreSQL 16 (Port 5434)
-- Enforces: Idempotent indexes, strict balance checks, and payout guarantees.
-- ==============================================================================

BEGIN;

-- 1. Strict Balance Checks on profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS chk_profiles_coins_non_negative;
ALTER TABLE profiles ADD CONSTRAINT chk_profiles_coins_non_negative CHECK (coins >= 0);

-- 2. Unique Constraints & Fast Lookup Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_msisdn ON profiles(msisdn);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wallet_tx_idempotency ON wallet_transactions(idempotency_key);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tournament_payouts_idemp ON tournament_payouts(idempotency_key);

-- 3. High-Performance Filtered & Composite Query Indexes
CREATE INDEX IF NOT EXISTS idx_tourn_entries_leaderboard_fast 
  ON tournament_entries(tournament_id, score DESC, submitted_at ASC);

CREATE INDEX IF NOT EXISTS idx_game_sessions_token_unfinalized 
  ON game_sessions(session_token) WHERE is_finalized = FALSE;

CREATE INDEX IF NOT EXISTS idx_payment_orders_pending 
  ON payment_orders(status) WHERE status = 'PENDING';

COMMIT;
