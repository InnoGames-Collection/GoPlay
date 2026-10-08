-- ==============================================================================
-- GoPlay — Migration 009: Port & Credentials Alignment
-- Aligns database state with ITG/shared-infra/PORT_ALLOCATION_CREDENTIALS_AND_ONBOARDING.md
-- ==============================================================================

-- 1. Ensure Extension for pgcrypto
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Master Admin Accounts (Section 2.4)
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
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    is_active = TRUE,
    updated_at = NOW();

-- 3. Preloaded Demo Player: 0977057270 (100 Preloaded Coins)
INSERT INTO profiles (id, phone, msisdn, display_name, avatar_id, coins, energy, telebirr_linked, telebirr_balance)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    '+251977057270',
    '251977057270',
    'Demo Player (100 Coins)',
    'avatar_runner',
    100,
    5,
    TRUE,
    0.00
)
ON CONFLICT (phone) DO UPDATE SET
    coins = GREATEST(profiles.coins, 100),
    telebirr_linked = TRUE,
    updated_at = NOW();

-- 4. Tournament Contender: 0911998890 (Score: 3,850)
INSERT INTO profiles (id, phone, msisdn, display_name, avatar_id, coins, energy, telebirr_linked, telebirr_balance)
VALUES (
    'c0000000-0000-0000-0000-000000000002',
    '+251911998890',
    '251911998890',
    'Tournament Contender',
    'avatar_champion',
    100,
    5,
    TRUE,
    0.00
)
ON CONFLICT (phone) DO UPDATE SET
    coins = GREATEST(profiles.coins, 100),
    telebirr_linked = TRUE,
    updated_at = NOW();

-- High Score Entry for Crazy Color (Score: 3,850)
INSERT INTO high_scores (user_id, game_id, best_score, updated_at)
VALUES (
    'c0000000-0000-0000-0000-000000000002',
    'crazy-colors',
    3850,
    NOW()
)
ON CONFLICT (user_id, game_id) DO UPDATE SET
    best_score = GREATEST(high_scores.best_score, 3850),
    updated_at = NOW();

-- Active Crazy Color Tournament Entry (Score: 3,850, Rank 1)
INSERT INTO tournament_entries (tournament_id, player_msisdn, masked_msisdn, score, rank, prize_etb)
VALUES (
    'tourn_crazy_colors_01',
    '251911998890',
    '091*****890',
    3850,
    1,
    10000
)
ON CONFLICT (tournament_id, player_msisdn) DO UPDATE SET
    score = GREATEST(tournament_entries.score, 3850),
    updated_at = NOW();
