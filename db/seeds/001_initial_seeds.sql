-- ==============================================================================
-- GoPlay — Baseline Seeds (Port 5434 / goplay_db)
-- Catalog of 12 Competitive Games (1 Tournament + 11 Free Passes)
-- ==============================================================================

-- 1. Default Admin Users
INSERT INTO admin_users (id, username, email, password_hash, role)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', 'superadmin', 'admin@goplay.innopulseplatform.com', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'SUPER_ADMIN'),
    ('b0000000-0000-0000-0000-000000000002', 'goplay_auditor', 'auditor@goplay.innopulseplatform.com', '$2b$10$7Z/l8K9QZg4e1oU6Qk7sNuR1aLzBvY7p0oQY6dZtLw6oVqZl9rQeS', 'AUDITOR')
ON CONFLICT (username) DO NOTHING;

-- 2. GoPlay 12 Games Catalog (1 Tournament + 11 Free Passes)
INSERT INTO games (game_id, title, category, is_free, requires_coins, is_enabled, max_score_per_sec, max_score)
VALUES
    ('crazy-colors', 'Crazy Color', 'arcade', false, true, true, 25, 5000),      -- 🏆 TOURNAMENT (2 Coins)
    ('juicy-match', 'Candy Juicy', 'casual', true, false, true, 80, 50000),       -- ⭐ FREE PASS
    ('emoji-fun', 'Emoji Fun', 'casual', true, false, true, 35, 3000),            -- ⭐ FREE PASS
    ('pop-piano', 'Pop Piano', 'music', true, false, true, 100, 30000),           -- ⭐ FREE PASS
    ('world-legends', 'Word Legend', 'knowledge', true, false, true, 30, 5000),   -- ⭐ FREE PASS
    ('candy-blast', 'Candy Crush', 'casual', true, false, true, 80, 50000),       -- ⭐ FREE PASS
    ('soccer-shooter', 'Soccer Shooter', 'sports', true, false, true, 50, 5000),  -- ⭐ FREE PASS
    ('dama', 'Dama', 'board', true, false, true, 50, 10000),                      -- ⭐ FREE PASS
    ('button-soccer', 'Button Soccer', 'sports', true, false, true, 20, 1000),    -- ⭐ FREE PASS
    ('soccer-ping-pong', 'Soccer Ping Pong', 'sports', true, false, true, 30, 2500), -- ⭐ FREE PASS
    ('bubble-sort', 'Bubble Sort', 'puzzle', true, false, true, 40, 4000),        -- ⭐ FREE PASS
    ('color-tap-sprint', 'Color Tap Sprint', 'arcade', true, false, true, 40, 5000) -- ⭐ FREE PASS
ON CONFLICT (game_id) DO UPDATE SET
    is_free = EXCLUDED.is_free,
    requires_coins = EXCLUDED.requires_coins;

-- 3. Active Weekly Tournament: Crazy Color Tournament
INSERT INTO tournaments (id, title, game_id, start_date, end_date, prize_pool_etb, status)
VALUES
    ('tourn_crazy_colors_01', 'Crazy Color Championship', 'crazy-colors', NOW() - INTERVAL '1 day', NOW() + INTERVAL '6 days', 25000, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Contenders for Crazy Color Tournament
INSERT INTO tournament_entries (tournament_id, player_msisdn, masked_msisdn, score, rank, prize_etb)
VALUES
    ('tourn_crazy_colors_01', '251911998877', '091*****877', 1540, 1, 10000),
    ('tourn_crazy_colors_01', '251922334455', '092*****455', 1380, 2, 6000),
    ('tourn_crazy_colors_01', '251933445566', '093*****566', 1190, 3, 3000),
    ('tourn_crazy_colors_01', '251944556677', '094*****677', 950, 4, 1000),
    ('tourn_crazy_colors_01', '251955667788', '095*****788', 820, 5, 1000)
ON CONFLICT (tournament_id, player_msisdn) DO NOTHING;
