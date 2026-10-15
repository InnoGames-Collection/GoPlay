-- ==============================================================================
-- GoPlay — Migration 011: Make Crazy Color Free & Directly Accessible
-- Enforces: Crazy Color entry fee is 0, requires_coins = FALSE, is_free = TRUE
-- ==============================================================================

BEGIN;

UPDATE games 
SET entry_fee_coins = 0, 
    requires_coins = FALSE, 
    is_free = TRUE 
WHERE game_id = 'crazy-colors';

COMMIT;
