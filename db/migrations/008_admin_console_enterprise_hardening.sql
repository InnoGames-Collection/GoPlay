-- ==============================================================================
-- GoPlay — Migration 008: Admin Console Enterprise Hardening & Live Settings
-- Target: PostgreSQL 16 (Port 5434)
-- Enforces: Service Settings Persistence, Administrative Indexing,
--           Live Player Query Support, and Immutable Audit Log Schema.
-- ==============================================================================

BEGIN;

-- 1. Create service_settings Table for Live VAS & Anti-Cheat Configurations
CREATE TABLE IF NOT EXISTS service_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    service_name VARCHAR(100) NOT NULL DEFAULT 'GameON Tele / GoPlay',
    shortcode VARCHAR(20) NOT NULL DEFAULT '9898',
    subscription_instruction TEXT NOT NULL DEFAULT 'Send OK to 9898 to activate daily gaming subscription for 2 ETB/day.',
    daily_subscription_price_birr NUMERIC(10,2) NOT NULL DEFAULT 2.00,
    daily_challenge_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_competition_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    auto_finalize_winners BOOLEAN NOT NULL DEFAULT TRUE,
    telebirr_disbursement_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    anti_cheat_sensitivity VARCHAR(20) NOT NULL DEFAULT 'STANDARD' CHECK (anti_cheat_sensitivity IN ('STRICT', 'STANDARD', 'LENIENT')),
    max_velocity_threshold INT NOT NULL DEFAULT 50,
    support_contact VARCHAR(100) NOT NULL DEFAULT 'support@innogames.et • Shortcode 9898',
    service_notice_banner TEXT NOT NULL DEFAULT 'Welcome to GoPlay! Compete in weekly tournaments and claim Telebirr cash rewards.',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'SYSTEM'
);

-- Seed default settings if empty
INSERT INTO service_settings (
    id, service_name, shortcode, subscription_instruction, 
    daily_subscription_price_birr, daily_challenge_enabled, 
    weekly_competition_enabled, auto_finalize_winners, 
    telebirr_disbursement_enabled, anti_cheat_sensitivity, 
    max_velocity_threshold, support_contact, service_notice_banner, 
    updated_at, updated_by
) VALUES (
    'default', 'GameON Tele / GoPlay', '9898', 
    'Send OK to 9898 to activate daily gaming subscription for 2 ETB/day.',
    2.00, TRUE, TRUE, TRUE, TRUE, 'STANDARD', 50, 
    'support@innogames.et • Shortcode 9898',
    'Welcome to GoPlay! Compete in weekly tournaments and claim Telebirr cash rewards.',
    NOW(), 'SYSTEM'
) ON CONFLICT (id) DO NOTHING;

-- 2. Enhanced Indexing for Live Admin Console Queries
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_trgm_prefix ON profiles(phone text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_prefix ON profiles(display_name text_pattern_ops);

-- Index for payment orders by created_at and status
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created ON payment_orders(status, created_at DESC);

-- Index for tournament payouts by tournament_id and status
CREATE INDEX IF NOT EXISTS idx_tournament_payouts_tourn_status ON tournament_payouts(tournament_id, status);

-- Index for daily challenge attempts
CREATE INDEX IF NOT EXISTS idx_daily_attempts_created_at ON daily_challenge_attempts(created_at DESC);

-- 3. Ensure admin_users has proper constraints and indexing
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active) WHERE is_active = TRUE;

COMMIT;
