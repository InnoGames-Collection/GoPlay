-- ==============================================================================
-- GoPlay — Migration 006: Daily & Weekly Challenge Enforcement & Anti-Replay
-- Target: PostgreSQL 16
-- Fixes: Strictly one daily challenge attempt per player per day,
--        strictly one active daily and one active weekly tournament at any time,
--        audit tracking of challenge attempts.
-- ==============================================================================

BEGIN;

-- 1. Add tournament_type to tournaments
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS 
  tournament_type VARCHAR(20) NOT NULL DEFAULT 'STANDARD'
  CHECK (tournament_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'STANDARD'));

-- Set existing weekly tournament types if title or cycle indicates
UPDATE tournaments 
   SET tournament_type = 'WEEKLY' 
 WHERE tournament_type = 'STANDARD' 
   AND (title ILIKE '%weekly%' OR title ILIKE '%championship%');

UPDATE tournaments 
   SET tournament_type = 'DAILY' 
 WHERE tournament_type = 'STANDARD' 
   AND title ILIKE '%daily%';

-- 2. Enforce strictly at most ONE ACTIVE Daily and ONE ACTIVE Weekly tournament
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_daily_tournament
  ON tournaments (tournament_type)
  WHERE status = 'ACTIVE' AND tournament_type = 'DAILY';

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_weekly_tournament
  ON tournaments (tournament_type)
  WHERE status = 'ACTIVE' AND tournament_type = 'WEEKLY';

-- 3. Daily Challenge Attempts Table (Strictly one attempt per player per calendar day)
CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tournament_id VARCHAR(50) NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    attempt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    score INT NOT NULL DEFAULT 0,
    session_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_daily_attempt_per_player UNIQUE (user_id, attempt_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_attempts_user_date ON daily_challenge_attempts(user_id, attempt_date);
CREATE INDEX IF NOT EXISTS idx_daily_attempts_tourn_date ON daily_challenge_attempts(tournament_id, attempt_date, score DESC);

-- 4. Seed an Active Daily Challenge Tournament if none exists
INSERT INTO tournaments (id, title, game_id, start_date, end_date, prize_pool_etb, status, tournament_type)
SELECT 
    'daily_challenge_today',
    'Daily Speed Challenge',
    'crazy-colors',
    CURRENT_DATE::TIMESTAMPTZ,
    (CURRENT_DATE + INTERVAL '1 day - 1 second')::TIMESTAMPTZ,
    5000,
    'ACTIVE',
    'DAILY'
WHERE NOT EXISTS (
    SELECT 1 FROM tournaments WHERE status = 'ACTIVE' AND tournament_type = 'DAILY'
);

COMMIT;
