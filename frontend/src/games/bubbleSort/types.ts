export type BubbleSortScreen = 'menu' | 'level-select' | 'gameplay';

export interface BubbleItem {
  id: string;
  words: string[];
  category: string;
  x: number; // percentage in arena (10 - 90)
  y: number; // percentage in arena (12 - 82)
  vx: number;
  vy: number;
  radius: number;
  colorStage: 1 | 2 | 3 | 4; // 1 = glass blue, 2 = green (2 items), 3 = purple (3 items), 4 = orange (4 items)
  isSelected?: boolean;
  isCompleted?: boolean;
  categoryLabel?: string;
  isPopping?: boolean;
  isSpawning?: boolean;
}

export interface CategoryDefinition {
  category: string;
  words: [string, string, string, string]; // exactly 4 words per category
}

export interface BubbleSortLevel {
  levelNumber: number;
  name: string;
  movesLimit: number;
  categories: CategoryDefinition[];
  initialVisibleCount?: number; // how many bubbles start in the arena
}

export interface LevelRecord {
  completed: boolean;
  stars: number;
  bestScore: number;
  timeSeconds: number;
}

export interface BubbleSortProgress {
  unlockedLevel: number;
  records: Record<number, LevelRecord>;
  wisdom: number;
  coins: number;
  hasExtraBubblesBooster: boolean;
  extraBubblesCount: number;
  highScore: number;
}

export interface FloatingParticle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
}

export interface FlyingOrb {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  color: string;
}
