-- ==============================================================================
-- GoPlay — Migration 005: Admin RBAC, Immutable Audit Logs & Anti-Cheat Hardening
-- Target: PostgreSQL 16 (Port 5434)
-- Enforces: Tier-0 Zero-Trust Admin RBAC, WORM-style Audit Logging, Player Ban States,
--           and High-Performance Dashboard Aggregation Indexes.
-- ==============================================================================

BEGIN;

-- 1. Ensure Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Upgrade admin_users Table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Expand role constraint on admin_users
ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS chk_admin_role;
ALTER TABLE admin_users ADD CONSTRAINT chk_admin_role CHECK (
    role IN ('SUPER_ADMIN', 'TOURNAMENT_OPERATOR', 'FINANCIAL_AUDITOR', 'SUPPORT_AGENT', 'AUDITOR')
);

-- Seed / Update Standard Administrative Personas for all 4 RBAC Roles
-- Passwords below are hashed via pgcrypto Blowfish (bcrypt cost factor 10)
-- Default initial credentials:
-- superadmin: GoPlay@Admin2026!
-- tourn_operator: GoPlay@Operator2026!
-- goplay_auditor: GoPlay@Auditor2026!
-- support_agent: GoPlay@Support2026!

INSERT INTO admin_users (id, username, email, password_hash, role, is_active)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'superadmin', 'admin@goplay.innopulseplatform.com', 
     crypt('GoPlay@Admin2026!', gen_salt('bf', 10)), 'SUPER_ADMIN', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'goplay_auditor', 'auditor@goplay.innopulseplatform.com', 
     crypt('GoPlay@Auditor2026!', gen_salt('bf', 10)), 'FINANCIAL_AUDITOR', TRUE),
    ('b0000000-0000-0000-0000-000000000003', 'tourn_operator', 'operator@goplay.innopulseplatform.com', 
     crypt('GoPlay@Operator2026!', gen_salt('bf', 10)), 'TOURNAMENT_OPERATOR', TRUE),
    ('b0000000-0000-0000-0000-000000000004', 'support_agent', 'support@goplay.innopulseplatform.com', 
     crypt('GoPlay@Support2026!', gen_salt('bf', 10)), 'SUPPORT_AGENT', TRUE)
ON CONFLICT (username) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = TRUE,
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- 3. Upgrade admin_audit_logs to Complete Schema & Enforce Immutability
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100);
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS entity_id VARCHAR(100);
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS old_value JSONB;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS new_value JSONB;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE admin_audit_logs ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Harmonize legacy target_type / target_id columns if present
UPDATE admin_audit_logs 
   SET entity_type = COALESCE(entity_type, target_type, 'SYSTEM'),
       entity_id = COALESCE(entity_id, target_id, 'UNKNOWN')
 WHERE entity_type IS NULL;

ALTER TABLE admin_audit_logs ALTER COLUMN entity_type SET NOT NULL;

-- Create Indexes for Audit Searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON admin_audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON admin_audit_logs(action);

-- Immutability Enforcement Function & Trigger (Zero-Trust WORM semantics)
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'CRITICAL SECURITY VIOLATION: admin_audit_logs is an immutable WORM ledger. Updates and deletions are strictly prohibited by compliance policy.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_admin_audit_logs ON admin_audit_logs;
CREATE TRIGGER trg_immutable_admin_audit_logs
    BEFORE UPDATE OR DELETE ON admin_audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_log_tampering();

-- 4. Player Ban States in Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_by VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(is_banned) WHERE is_banned = TRUE;

-- 5. High-Performance Filtered Indexes for Sub-Millisecond Dashboard KPIs
CREATE INDEX IF NOT EXISTS idx_subscriptions_v2_active ON subscriptions_v2(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_game_sessions_fraud ON game_sessions(fraud_flag) WHERE fraud_flag = TRUE;
CREATE INDEX IF NOT EXISTS idx_payment_orders_success ON payment_orders(status) WHERE status = 'SUCCESS';
CREATE INDEX IF NOT EXISTS idx_tournaments_active ON tournaments(status) WHERE status = 'ACTIVE';

COMMIT;
