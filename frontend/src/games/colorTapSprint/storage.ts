import { ColorTapSprintProgress, LevelRecord } from './types';

const STORAGE_KEY = 'goplay_color_tap_sprint_progress_v1';

const DEFAULT_PROGRESS: ColorTapSprintProgress = {
  unlockedLevel: 1,
  records: {},
  bestScore: 0,
  focusCount: 1,
};

export function loadColorTapSprintProgress(): ColorTapSprintProgress {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      unlockedLevel: Math.min(40, Math.max(1, parsed.unlockedLevel || 1)),
      records: parsed.records || {},
      bestScore: typeof parsed.bestScore === 'number' ? parsed.bestScore : 0,
      focusCount: typeof parsed.focusCount === 'number' ? parsed.focusCount : 1,
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}

export function saveColorTapSprintProgress(progress: ColorTapSprintProgress): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.warn('Failed to save Color Tap Sprint progress:', e);
  }
}

export function saveLevelResult(
  levelNumber: number,
  score: number,
  combo: number,
  accuracy: number,
  completed: boolean
): { progress: ColorTapSprintProgress; isNewBest: boolean; isNewLevelUnlocked: boolean } {
  const current = loadColorTapSprintProgress();
  const isNewBest = score > current.bestScore;

  const stars = !completed ? 0 : accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1;
  const prevRec = current.records[levelNumber];

  const updatedRecord: LevelRecord = {
    completed: completed || (prevRec?.completed ?? false),
    stars: Math.max(stars, prevRec?.stars ?? 0),
    bestScore: Math.max(score, prevRec?.bestScore ?? 0),
    bestCombo: Math.max(combo, prevRec?.bestCombo ?? 0),
    accuracy: Math.max(accuracy, prevRec?.accuracy ?? 0),
  };

  const nextLevel = Math.min(40, levelNumber + 1);
  const isNewLevelUnlocked = completed && nextLevel > current.unlockedLevel;
  const newUnlocked = completed ? Math.max(current.unlockedLevel, nextLevel) : current.unlockedLevel;

  const updated: ColorTapSprintProgress = {
    ...current,
    unlockedLevel: newUnlocked,
    records: {
      ...current.records,
      [levelNumber]: updatedRecord,
    },
    bestScore: Math.max(current.bestScore, score),
  };

  saveColorTapSprintProgress(updated);
  return { progress: updated, isNewBest, isNewLevelUnlocked };
}

export function addFocusCharge(amount: number = 1): number {
  const current = loadColorTapSprintProgress();
  current.focusCount = Math.max(0, current.focusCount + amount);
  saveColorTapSprintProgress(current);
  return current.focusCount;
}

export function useFocusCharge(): boolean {
  const current = loadColorTapSprintProgress();
  if (current.focusCount <= 0) return false;
  current.focusCount -= 1;
  saveColorTapSprintProgress(current);
  return true;
}
