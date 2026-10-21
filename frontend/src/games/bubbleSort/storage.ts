import { BubbleSortProgress, LevelRecord } from './types';

const STORAGE_KEY = 'goplay_bubble_sort_progress_v1';

const DEFAULT_PROGRESS: BubbleSortProgress = {
  unlockedLevel: 1,
  records: {},
  wisdom: 74,
  coins: 100,
  hasExtraBubblesBooster: false,
  extraBubblesCount: 0,
  highScore: 0,
};

export interface BubbleSortScoreResult {
  finalScore: number;
  validActionPoints: number;
  difficultyBonus: number;
  timePenalty: number;
  mistakePenalty: number;
}

/**
 * Calibrated Score Engine for Bubble Sort:
 * Final score = max(0, valid-action points + difficulty bonus - time penalty - mistake penalty)
 * - 10 base points per sorted category
 * - Modest bounded difficulty bonus
 * - Modest bounded active time penalty
 * - Mistake penalty for invalid category merges
 */
export function calculateBubbleSortScore(
  completedCategories: number,
  levelNumber: number,
  activeDurationSec: number,
  mistakesCount: number
): BubbleSortScoreResult {
  const validActionPoints = Math.max(0, completedCategories) * 10;
  const difficultyBonus = Math.min(10, Math.floor(Math.max(1, levelNumber) / 4));
  const timePenalty = Math.min(5, Math.floor(Math.max(0, activeDurationSec) / 30));
  const mistakePenalty = Math.min(5, Math.max(0, mistakesCount));
  const finalScore = Math.max(0, validActionPoints + difficultyBonus - timePenalty - mistakePenalty);
  return {
    finalScore,
    validActionPoints,
    difficultyBonus,
    timePenalty,
    mistakePenalty,
  };
}

export function loadBubbleSortProgress(): BubbleSortProgress {
  if (typeof window === 'undefined') {
    return DEFAULT_PROGRESS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      unlockedLevel: Math.min(40, Math.max(1, parsed.unlockedLevel || 1)),
      records: parsed.records || {},
      wisdom: typeof parsed.wisdom === 'number' ? parsed.wisdom : 74,
      coins: typeof parsed.coins === 'number' ? parsed.coins : 100,
      hasExtraBubblesBooster: Boolean(parsed.hasExtraBubblesBooster),
      extraBubblesCount: typeof parsed.extraBubblesCount === 'number' ? parsed.extraBubblesCount : 0,
      highScore: typeof parsed.highScore === 'number' ? parsed.highScore : 0,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveBubbleSortProgress(progress: BubbleSortProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save Bubble Sort progress:', e);
  }
}

export function saveLevelCompletion(
  levelNumber: number,
  score: number,
  movesLeft: number,
  timeSeconds: number
): { progress: BubbleSortProgress; isNewLevelUnlocked: boolean; stars: number } {
  const current = loadBubbleSortProgress();
  const stars = movesLeft >= 15 ? 3 : movesLeft >= 8 ? 2 : 1;

  const prevRecord = current.records[levelNumber];
  const updatedRecord: LevelRecord = {
    completed: true,
    stars: Math.max(stars, prevRecord?.stars || 0),
    bestScore: Math.max(score, prevRecord?.bestScore || 0),
    timeSeconds: Math.min(timeSeconds, prevRecord?.timeSeconds || timeSeconds),
  };

  const nextLevel = Math.min(40, levelNumber + 1);
  const isNewLevelUnlocked = nextLevel > current.unlockedLevel;
  const newUnlocked = Math.max(current.unlockedLevel, nextLevel);

  // Grant wisdom points on level completion
  const updatedWisdom = current.wisdom + 1;
  const updatedCoins = current.coins + 25;

  // Unlock extra bubbles booster at level 3 if not yet unlocked
  const unlockedBooster = current.hasExtraBubblesBooster || levelNumber >= 2;
  const boosterCount = unlockedBooster && !current.hasExtraBubblesBooster ? 3 : current.extraBubblesCount;

  const totalScore = Object.values({ ...current.records, [levelNumber]: updatedRecord }).reduce(
    (acc, rec) => acc + (rec?.bestScore || 0),
    0
  );

  const updated: BubbleSortProgress = {
    ...current,
    unlockedLevel: newUnlocked,
    records: {
      ...current.records,
      [levelNumber]: updatedRecord,
    },
    wisdom: updatedWisdom,
    coins: updatedCoins,
    hasExtraBubblesBooster: unlockedBooster,
    extraBubblesCount: boosterCount,
    highScore: Math.max(current.highScore, totalScore),
  };

  saveBubbleSortProgress(updated);
  return { progress: updated, isNewLevelUnlocked, stars };
}

export function consumeExtraBubble(): boolean {
  const current = loadBubbleSortProgress();
  if (current.extraBubblesCount <= 0) return false;
  current.extraBubblesCount -= 1;
  saveBubbleSortProgress(current);
  return true;
}

export function unlockBoosterReward(): BubbleSortProgress {
  const current = loadBubbleSortProgress();
  current.hasExtraBubblesBooster = true;
  current.extraBubblesCount = Math.max(3, current.extraBubblesCount + 3);
  saveBubbleSortProgress(current);
  return current;
}
