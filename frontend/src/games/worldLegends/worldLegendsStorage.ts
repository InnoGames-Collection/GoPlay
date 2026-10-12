/**
 * World Legends - Tournament & Campaign Progression Storage Manager
 * Tracks unlocked levels (1 to 40), level scores, total cumulative score, and sound settings.
 */

import { GameLeaderboardService } from '../../services/gameLeaderboardService';

export interface WorldLegendsProgress {
  unlockedLevel: number;
  completedLevels: number[];
  levelScores: Record<number, number>;
  totalScore: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const STORAGE_KEY = 'world_legends_progression_v2';
const LEGACY_UNLOCKED_KEY = 'world_legends_unlocked_level';

const DEFAULT_PROGRESS: WorldLegendsProgress = {
  unlockedLevel: 1,
  completedLevels: [],
  levelScores: {},
  totalScore: 0,
  soundEnabled: true,
  vibrationEnabled: true,
};

export function loadWorldLegendsProgress(): WorldLegendsProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WorldLegendsProgress;
      if (parsed && typeof parsed.unlockedLevel === 'number') {
        return {
          unlockedLevel: Math.max(1, Math.min(40, parsed.unlockedLevel)),
          completedLevels: Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [],
          levelScores: parsed.levelScores || {},
          totalScore: typeof parsed.totalScore === 'number' ? parsed.totalScore : 0,
          soundEnabled: parsed.soundEnabled !== false,
          vibrationEnabled: parsed.vibrationEnabled !== false,
        };
      }
    }

    // Check legacy key
    const legacyUnlocked = localStorage.getItem(LEGACY_UNLOCKED_KEY);
    if (legacyUnlocked) {
      const lvl = parseInt(legacyUnlocked, 10);
      if (!isNaN(lvl) && lvl >= 1) {
        const completed: number[] = [];
        const scores: Record<number, number> = {};
        let sum = 0;
        for (let i = 1; i < lvl; i++) {
          completed.push(i);
          scores[i] = 120 + (i * 10);
          sum += scores[i];
        }
        const migrated: WorldLegendsProgress = {
          unlockedLevel: Math.min(40, lvl),
          completedLevels: completed,
          levelScores: scores,
          totalScore: sum,
          soundEnabled: true,
          vibrationEnabled: true,
        };
        saveWorldLegendsProgress(migrated);
        return migrated;
      }
    }

    return DEFAULT_PROGRESS;
  } catch (err) {
    console.warn('[WorldLegends] Failed to load progression:', err);
    return DEFAULT_PROGRESS;
  }
}

export function saveWorldLegendsProgress(progress: WorldLegendsProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    localStorage.setItem(LEGACY_UNLOCKED_KEY, String(progress.unlockedLevel));
  } catch (err) {
    console.warn('[WorldLegends] Failed to save progression:', err);
  }
}

export function recordWorldLegendsCompletion(
  levelNum: number,
  scoreEarned: number
): { progress: WorldLegendsProgress; isNewUnlock: boolean } {
  const current = loadWorldLegendsProgress();
  const nextUnlocked = Math.min(40, Math.max(current.unlockedLevel, levelNum + 1));
  const isNewUnlock = nextUnlocked > current.unlockedLevel;

  const completedSet = new Set(current.completedLevels);
  completedSet.add(levelNum);

  const prevScore = current.levelScores[levelNum] || 0;
  const bestScore = Math.max(prevScore, scoreEarned);

  const updatedScores = {
    ...current.levelScores,
    [levelNum]: bestScore,
  };

  const totalScore = Object.values(updatedScores).reduce((sum, s) => sum + s, 0);

  const newProgress: WorldLegendsProgress = {
    ...current,
    unlockedLevel: nextUnlocked,
    completedLevels: Array.from(completedSet).sort((a, b) => a - b),
    levelScores: updatedScores,
    totalScore,
  };

  saveWorldLegendsProgress(newProgress);
  return { progress: newProgress, isNewUnlock };
}

export function resetWorldLegendsProgress(): WorldLegendsProgress {
  const reset: WorldLegendsProgress = {
    unlockedLevel: 1,
    completedLevels: [],
    levelScores: {},
    totalScore: 0,
    soundEnabled: true,
    vibrationEnabled: true,
  };
  saveWorldLegendsProgress(reset);
  return reset;
}

/**
 * Mask MSISDN according to specifications:
 * First 5 digits + '*****' + Last 2 digits
 * e.g. 251911598830 -> 25191*****30
 */
export function formatMsisdnMasked(rawPhone?: string): string {
  let clean = (rawPhone || '').replace(/\D/g, '');
  if (clean.startsWith('09') && clean.length === 10) {
    clean = '251' + clean.slice(1);
  } else if (!clean.startsWith('251') && clean.length >= 9) {
    clean = '251' + clean.slice(-9);
  } else if (!clean) {
    clean = '251911598830';
  }

  if (clean.length >= 7) {
    const first5 = clean.slice(0, 5);
    const last2 = clean.slice(-2);
    return `${first5}*****${last2}`;
  }
  return '25191*****30';
}

export interface WorldLegendsLeaderboardEntry {
  rank: number;
  msisdnMasked: string;
  score: number;
  level: number;
  isPlayer: boolean;
}

export function getWorldLegendsLeaderboard(
  playerMsisdn: string,
  playerScore: number,
  playerLevel: number
): { list: WorldLegendsLeaderboardEntry[]; userRank: number; userEntry: WorldLegendsLeaderboardEntry } {
  const playerEntry: WorldLegendsLeaderboardEntry = {
    rank: 0,
    msisdnMasked: formatMsisdnMasked(playerMsisdn),
    score: playerScore,
    level: playerLevel,
    isPlayer: true,
  };

  // Fetch live entries from unified PostgreSQL leaderboard engine
  const liveResult = GameLeaderboardService.getLeaderboardForGame('world-legends');
  const competitors: WorldLegendsLeaderboardEntry[] = (liveResult?.entries || [])
    .filter((e) => !e.isCurrentUser)
    .map((e) => ({
      rank: 0,
      msisdnMasked: e.playerMasked || '25191*****00',
      score: e.score,
      level: Math.max(1, Math.round(e.score / 350)),
      isPlayer: false,
    }));

  const allEntries: WorldLegendsLeaderboardEntry[] = [
    ...competitors,
    playerEntry,
  ];

  // Sort descending by score, tiebreak by level
  allEntries.sort((a, b) => b.score - a.score || b.level - a.level);

  let userRank = 1;
  allEntries.forEach((entry, idx) => {
    entry.rank = idx + 1;
    if (entry.isPlayer) {
      userRank = entry.rank;
    }
  });

  return {
    list: allEntries,
    userRank,
    userEntry: playerEntry,
  };
}

