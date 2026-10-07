export type ColorTapSprintScreen = 'menu' | 'level-select' | 'gameplay';

export type ColorId =
  | 'BLUE'
  | 'RED'
  | 'GREEN'
  | 'LIME'
  | 'YELLOW'
  | 'ORANGE'
  | 'PURPLE'
  | 'PINK'
  | 'CYAN';

export interface ColorDefinition {
  id: ColorId;
  name: string;
  bgHex: string;
  targetHex: string;
  textOnCardHex: string;
}

export interface CardItem {
  id: string;
  colorId: ColorId; // The REAL background color of the card
  wordLabel: string; // The written word on the card (Stroop distractor)
  bgHex: string;
  textOnCardHex: string;
}

export interface ColorTapSprintLevel {
  levelNumber: number;
  name: string;
  targetCorrectTaps: number;
  initialTimeSeconds: number;
  timeBonusSeconds: number;
  timePenaltySeconds: number;
  cardCount: 4 | 6 | 8 | 9;
  useStroopDecoy: boolean;
  colorPool: ColorId[];
}

export interface LevelRecord {
  completed: boolean;
  stars: number;
  bestScore: number;
  bestCombo: number;
  accuracy: number;
}

export interface ColorTapSprintProgress {
  unlockedLevel: number;
  records: Record<number, LevelRecord>;
  bestScore: number;
  focusCount: number;
}

export interface FloatingFeedback {
  id: string;
  text: string;
  isPositive: boolean;
  x?: number;
  y?: number;
}
