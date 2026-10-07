/**
 * GameON Tele - Data-Driven Game Catalog (Designed for 100+ Games)
 * Scalable Game Discovery, Category Classification, and Access Models.
 */

import { getGameArtworkUrl } from './gameArtwork';

export type GameAccessType = 'FREE' | 'COIN' | 'SUBSCRIPTION' | 'PURCHASE' | 'TRIAL';

export interface GameSubscriptionOptions {
  daily?: { enabled: boolean; priceETB: number };
  weekly?: { enabled: boolean; priceETB: number };
  monthly?: { enabled: boolean; priceETB: number };
}

export interface CatalogGame {
  gameId: string;
  gameName: string;
  titleAmharic: string;
  category: 'Action' | 'Arcade' | 'Puzzle' | 'Racing' | 'Sports' | 'Adventure' | 'Board' | 'Music' | 'Casual' | 'Strategy' | 'Other';
  genre: string;
  tagline: string;
  description: string;
  thumbnail: string;
  banner: string;
  accessType: GameAccessType;
  price?: number; // for ONE-TIME PURCHASE
  billingPeriod?: ('daily' | 'weekly' | 'monthly')[];
  isFeatured: boolean;
  isActive: boolean;
  isNew: boolean;
  isRecommended?: boolean;
  isFree: boolean;
  requiresCoins: boolean;
  coinCost: number;
  subscriptionOptions?: GameSubscriptionOptions;
  leaderboardEnabled: boolean;
  sortOrder: number;
  providerId?: string;
  providerName?: string;
  rating: number;
  playsCount: number;
  instructions: string[];
  controlsDescription: string;
  primaryColor: string;
  secondaryColor: string;
}

export const ALL_STANDARD_CATEGORIES = [
  'All Games',
  'Action',
  'Arcade',
  'Puzzle',
  'Racing',
  'Sports',
  'Adventure',
  'Board',
  'Music',
  'Casual',
  'Strategy',
  'Other',
] as const;

export const MANDATORY_CATALOG_ORDER = [
  'crazy-colors', // 1
  'juicy-match', // 2
  'emoji-fun', // 3
  'pop-piano', // 4
  'world-legends', // 5
  'candy-blast', // 6
  'soccer-shooter', // 7
  'dama', // 8
  'button-soccer', // 9
  'soccer-ping-pong', // 10
  'bubble-sort', // 11
  'color-tap-sprint', // 12
] as const;

export const INITIAL_GAME_CATALOG: CatalogGame[] = [
  {
    gameId: 'crazy-colors',
    gameName: 'Crazy Color',
    titleAmharic: 'ክሬዚ ከለር',
    category: 'Arcade',
    genre: 'Precision Color Match Physics',
    tagline: 'Bounce upwards, pass through matching neon obstacles, and conquer 40 levels!',
    description: 'The definitive 40-level Crazy Colors experience based on authentic color-matching physics. Tap to bounce against gravity, time passes through matching neon segments, collect stars, and become the Grandmaster!',
    thumbnail: getGameArtworkUrl('crazy-colors'),
    banner: getGameArtworkUrl('crazy-colors'),
    accessType: 'COIN',
    isFree: false,
    requiresCoins: true,
    coinCost: 2,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 0,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.99,
    playsCount: 560000,
    primaryColor: '#FF008C',
    secondaryColor: '#00D9FF',
    instructions: [
      'Tap anywhere on the screen to bounce upwards against gravity',
      'Your ball can only pass through obstacle segments that match its current color',
      'Passing through Color Switcher orbs changes your ball color for upcoming obstacles',
    ],
    controlsDescription: 'Tap or click screen to jump. Spacebar supported on desktop.',
  },
  {
    gameId: 'juicy-match',
    gameName: 'Candy Juicy',
    titleAmharic: 'ኬንዲ ጁሲ',
    category: 'Puzzle',
    genre: '3D Tropical Match-3',
    tagline: 'Match glossy 3D tropical fruits, trigger juice cascades, and conquer 40 island levels!',
    description: 'A vibrant and juicy Match-3 puzzle adventure. Swap 3D strawberries, blueberries, kiwi slices, bananas, and grapes to shatter crates, uncover treasure chests, and unleash Rainbow Bomb combos across 40 challenging tropical levels.',
    thumbnail: getGameArtworkUrl('juicy-match'),
    banner: getGameArtworkUrl('juicy-match'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 1,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.99,
    playsCount: 420000,
    primaryColor: '#f59e0b',
    secondaryColor: '#0284c7',
    instructions: [
      'Swipe or tap adjacent fruits to create rows or columns of 3 matching fruits',
      'Match 4 fruits to create Striped Fruits that blast entire rows or columns',
      'Match 5 fruits in a line to form the Rainbow Super Fruit that clears all fruits of one color',
    ],
    controlsDescription: 'Swipe or tap adjacent fruits to swap. Tap boosters to activate.',
  },
  {
    gameId: 'emoji-fun',
    gameName: 'EMOJI FUN',
    titleAmharic: 'ኢሞጂ ፈን',
    category: 'Puzzle',
    genre: 'Tournament Emoji Puzzle & Knowledge',
    tagline: 'Master 40 levels of emoji puzzles, combinations, sequences & tournament scoring!',
    description: 'The official EMOJI FUN tournament puzzle arena. Solve 15 unique emoji puzzle categories across 40 levels with dynamic skill-based scoring, combos, hints, lives, store, and competitive leaderboard.',
    thumbnail: getGameArtworkUrl('emoji-fun'),
    banner: getGameArtworkUrl('emoji-fun'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 2,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.99,
    playsCount: 350000,
    primaryColor: '#ffb300',
    secondaryColor: '#f43f5e',
    instructions: [
      'Analyze the emoji presentation and answer before the countdown timer expires',
      'Answer quickly to earn up to +50% speed bonus points',
      'Chain consecutive correct answers to multiply tournament score up to 2.5x',
      'Use hints to eliminate wrong choices when stuck on tricky puzzles',
    ],
    controlsDescription: 'Tap the correct answer tile.',
  },
  {
    gameId: 'pop-piano',
    gameName: 'Pop Piano',
    titleAmharic: 'ፖፕ ፒያኖ',
    category: 'Music',
    genre: 'Rhythm Piano Beat Tiles',
    tagline: 'Tap falling glowing keys to chart-topping melodies and rhythms!',
    description: 'Fast rhythm piano tile gameplay featuring popular songs, acoustic chords, and global hits. Tap descending piano tiles in sync with the beat to achieve perfect harmony.',
    thumbnail: getGameArtworkUrl('pop-piano'),
    banner: getGameArtworkUrl('pop-piano'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: false,
    leaderboardEnabled: true,
    sortOrder: 3,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.9,
    playsCount: 187400,
    primaryColor: '#8b5cf6',
    secondaryColor: '#70C922',
    instructions: [
      'Tap the descending piano tiles exactly as they hit the rhythm baseline bar',
      'Hold down long note tiles for sustained chord points and acoustic vibrato',
      'Do not tap empty spaces or let any piano note pass the baseline without tapping',
    ],
    controlsDescription: 'Tap keys on screen or use keyboard keys [D] [F] [J] [K].',
  },
  {
    gameId: 'world-legends',
    gameName: 'Word Legend',
    titleAmharic: 'ዎርድ ሌጀንድ',
    category: 'Puzzle',
    genre: 'Civilization & Mythology Trivia Puzzle',
    tagline: 'Journey through world history, mythology, ancient civilizations, and lore!',
    description: 'An immersive knowledge and trivia adventure. Answer intriguing questions on world civilizations, ancient mythology, Ethiopian imperial heritage, and legendary world events.',
    thumbnail: getGameArtworkUrl('world-legends'),
    banner: getGameArtworkUrl('world-legends'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 4,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.9,
    playsCount: 189000,
    primaryColor: '#f59e0b',
    secondaryColor: '#05234A',
    instructions: [
      'Answer 10 rapid multiple-choice legend questions before the 15-second timer runs out',
      'Score bonus speed points by answering accurately within the first 3 seconds',
      'Use 50:50 and Clue lifelines when facing complex historical questions',
    ],
    controlsDescription: 'Tap the correct historical answer card.',
  },
  {
    gameId: 'candy-blast',
    gameName: 'Candy Crush',
    titleAmharic: 'ኬንዲ ክራሽ',
    category: 'Puzzle',
    genre: 'Match-3 Confectionery Puzzle',
    tagline: 'Match vibrant honey candies, trigger sweet sugar blasts and combos!',
    description: 'A delightful confectionery match-3 puzzle. Swap and connect 3 or more delicious honey candies to trigger colorful cascades, sweet sugar blasts, and massive combo multipliers.',
    thumbnail: getGameArtworkUrl('candy-blast'),
    banner: getGameArtworkUrl('candy-blast'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: false,
    leaderboardEnabled: true,
    sortOrder: 5,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.9,
    playsCount: 245000,
    primaryColor: '#e11d48',
    secondaryColor: '#70C922',
    instructions: [
      'Swap adjacent candies to create horizontal or vertical rows of 3 matching colors',
      'Match 4 candies to create explosive Striped Candies that clear entire rows',
      'Combine 5 candies to form a Rainbow Honey Bomb that blasts all candies of the same color',
    ],
    controlsDescription: 'Tap and swipe candies to swap positions.',
  },
  {
    gameId: 'soccer-shooter',
    gameName: 'Soccer Shooter',
    titleAmharic: 'ሶከር ሹተር',
    category: 'Sports',
    genre: 'Stadium Soccer Bubble Match',
    tagline: 'Kick 3D national soccer balls, execute wall bank shots, and clear 40 World Cup levels!',
    description: 'The championship edition of Soccer Shooter. Aim the precision dotted trajectory guide from the penalty spot, bank shots off stadium walls, trigger massive goalmouth cluster drops (+250 PTS), and manage penalty fouls.',
    thumbnail: getGameArtworkUrl('soccer-shooter'),
    banner: getGameArtworkUrl('soccer-shooter'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: false,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 6,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.99,
    playsCount: 275000,
    primaryColor: '#009739',
    secondaryColor: '#061325',
    instructions: [
      'Touch and drag in the stadium field to aim the precision dotted trajectory laser',
      'Bounce kicks off stadium walls to reach upper root soccer balls and trigger falling cascades',
      'Match 3 or more soccer balls to pop them with crowd celebration',
    ],
    controlsDescription: 'Touch/drag to aim, release to kick. Tap SWAP button to change upcoming ball.',
  },
  {
    gameId: 'dama',
    gameName: 'Dama',
    titleAmharic: 'ዳማ',
    category: 'Board',
    genre: '3D Ethiopian Draughts Strategy',
    tagline: 'Master the 3D championship draughts board against intelligent tactical AI!',
    description: 'Single-player 3D Draughts (Dama) against an advanced computer opponent. Experience physical wooden pieces, realistic board depth, mandatory captures, multi-jumps, and king crowning across progressive challenges.',
    thumbnail: getGameArtworkUrl('dama'),
    banner: getGameArtworkUrl('dama'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: false,
    leaderboardEnabled: true,
    sortOrder: 7,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.98,
    playsCount: 156000,
    primaryColor: '#b45309',
    secondaryColor: '#1c1917',
    instructions: [
      'Tap your white pieces to reveal legal diagonal moves and mandatory capture paths',
      'Jumps and chain captures are strictly mandatory when available on the board',
      'Reach the opponent back rank to crown your piece into a powerful King',
    ],
    controlsDescription: 'Tap piece to select, then tap highlighted square to move.',
  },
  {
    gameId: 'button-soccer',
    gameName: 'Button Soccer',
    titleAmharic: 'የአዝራር እግር ኳስ',
    category: 'Sports',
    genre: '2026 World Tour Table Soccer',
    tagline: 'Drag back to aim & power, execute bank shots, and conquer 40 very difficult Championship levels!',
    description: 'The authentic 2026 World Tour button soccer tournament. Choose your nation, drag back from your 3D team discs to aim & power, score against very difficult AI opponents, and conquer 40 championship levels with pass-and-play 2-player mode.',
    thumbnail: getGameArtworkUrl('button-soccer'),
    banner: getGameArtworkUrl('button-soccer'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 8,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.99,
    playsCount: 210000,
    primaryColor: '#009C3B',
    secondaryColor: '#FFD54F',
    instructions: [
      'Touch and drag backward from your team disc to aim and set shot power',
      'Release to strike the soccer ball towards the opponent goal',
      'First team to reach the target goals or highest score at full time wins',
    ],
    controlsDescription: 'Touch and drag backward from your disc to aim & set power, release to shoot.',
  },
  {
    gameId: 'soccer-ping-pong',
    gameName: 'Soccer Ping Pong',
    titleAmharic: 'ሶከር ፒንግ ፖንግ',
    category: 'Sports',
    genre: '3D Soccer Table Tennis Arcade',
    tagline: 'Master professional 3D soccer table tennis across 20 stadium levels!',
    description: 'Control a high-velocity 3D soccer ball in fast-paced table tennis rallies against tactical AI opponents. Execute precision volleys, curve spins, power smashes, and obstacle rebounds across 6 progressive stadiums.',
    thumbnail: getGameArtworkUrl('soccer-ping-pong'),
    banner: getGameArtworkUrl('soccer-ping-pong'),
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isActive: true,
    isNew: true,
    leaderboardEnabled: true,
    sortOrder: 9,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.99,
    playsCount: 198000,
    primaryColor: '#1688C9',
    secondaryColor: '#8BCB3D',
    instructions: [
      'Slide your striker left and right to intercept the incoming soccer ball',
      'Time returns within the glowing green Sweet-Spot zone for power shots and combo multipliers',
      'Maintain continuous rallies without letting the ball pass your baseline',
    ],
    controlsDescription: 'Touch and drag striker horizontally, or use mouse / arrow keys.',
  },
  {
    gameId: 'bubble-sort',
    gameName: 'BUBBLE SORT',
    titleAmharic: 'የአረፋ መድደር',
    category: 'Puzzle',
    genre: 'Underwater Word Category Puzzle',
    tagline: 'Sort floating word bubbles into category clusters, trigger giant merges and conquer 40 tournament levels!',
    description: 'An underwater tournament puzzle challenge inspired by the official video reference. Tap floating glass bubbles to merge related words into colorful category clusters. Watch bubbles transform from single words to Green (2 words), Purple (3 words), and Orange (Category complete), then burst into magnificent splash particles. Features 40 hard tournament levels, move limits, wisdom rewards, and the Extra Bubbles booster.',
    thumbnail: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&auto=format&fit=crop&q=80',
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isNew: true,
    isActive: true,
    leaderboardEnabled: true,
    sortOrder: 10,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.98,
    playsCount: 195000,
    primaryColor: '#0284C7',
    secondaryColor: '#F97316',
    instructions: [
      'Tap floating word bubbles that share the same category to merge them into larger bubbles',
      'Merging 2 related words turns the bubble Lime Green',
      'Merging 3 related words turns the bubble Purple',
      'Merging all 4 related words creates an Orange Category Bubble that transforms into the Category Name and pops',
      'Watch your remaining moves at the top-left and clear all categories before running out of moves',
      'Complete each level to sequentially unlock all 40 tournament levels and earn Extra Bubbles boosters',
    ],
    controlsDescription: 'Tap bubbles to select and merge. Tap reload to reset current level. Tap pause to open options. 100% mobile touch friendly.',
  },
  {
    gameId: 'color-tap-sprint',
    gameName: 'COLOR TAP SPRINT',
    titleAmharic: 'የቀለም ምት ፍጥነት',
    category: 'Arcade',
    genre: 'Candy Reflex Color Sprint',
    tagline: 'Train your color reflex! Tap the matching card colors in a high-speed tournament sprint across 40 levels!',
    description: 'The official Color Tap Sprint tournament game. Follow the prompt "TAP THE CARD COLOR" and strike the card whose background color matches the target. Avoid tricky Stroop word decoys, maintain combo streaks, earn time bonuses, and utilize Focus boosters to conquer 40 increasingly hard tournament levels.',
    thumbnail: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=600&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=1200&auto=format&fit=crop&q=80',
    accessType: 'FREE',
    isFree: true,
    requiresCoins: false,
    coinCost: 0,
    isFeatured: true,
    isRecommended: true,
    isNew: true,
    isActive: true,
    leaderboardEnabled: true,
    sortOrder: 11,
    providerId: 'prv_gameon_core',
    providerName: 'GameON Studios',
    rating: 4.98,
    playsCount: 220000,
    primaryColor: '#EC4899',
    secondaryColor: '#F59E0B',
    instructions: [
      'Look at the target color displayed under TAP THE CARD COLOR (e.g. BLUE)',
      'Tap the card whose BACKGROUND COLOR matches the target color',
      'Do NOT get tricked by the written word on the card — always match the card COLOR',
      'Correct taps award points, extend your combo, and add +1.3s to the timer',
      'Wrong taps deduct time (-4s) and break your combo streak',
      'Use the green FOCUS booster to reveal the correct card and slow down time when stuck',
      'Conquer all 40 tournament levels sequentially to claim the Grandmaster title',
    ],
    controlsDescription: 'Tap the matching colored card. Tap Focus to highlight the target. 100% mobile touch responsive.',
  }
];

export const GameCatalog = {
  getAll(): CatalogGame[] {
    const orderIndexMap = new Map(MANDATORY_CATALOG_ORDER.map((id, idx) => [id, idx]));
    return INITIAL_GAME_CATALOG.filter((g) => g.isActive)
      .sort((a, b) => (orderIndexMap.get(a.gameId as any) ?? 999) - (orderIndexMap.get(b.gameId as any) ?? 999))
      .map((g) => {
        const art = getGameArtworkUrl(g.gameId);
        return art ? { ...g, thumbnail: art, banner: art } : g;
      });
  },

  getById(gameId: string): CatalogGame | undefined {
    const g = INITIAL_GAME_CATALOG.find((g) => g.gameId === gameId);
    if (!g) return undefined;
    const art = getGameArtworkUrl(g.gameId);
    return art ? { ...g, thumbnail: art, banner: art } : g;
  },

  getByCategory(category: string): CatalogGame[] {
    if (category === 'All Games') {
      return this.getAll();
    }
    return this.getAll().filter((g) => g.category.toLowerCase() === category.toLowerCase());
  },

  /**
   * Only return categories that currently contain active games, with 'All Games' first
   */
  getCategoriesWithGames(): string[] {
    const categoriesSet = new Set<string>();
    this.getAll().forEach((game) => {
      categoriesSet.add(game.category);
    });

    // Ensure order conforms to ALL_STANDARD_CATEGORIES
    const ordered = ALL_STANDARD_CATEGORIES.filter(
      (cat) => cat === 'All Games' || categoriesSet.has(cat)
    );
    return ordered as unknown as string[];
  },

  getFeatured(): CatalogGame[] {
    return this.getAll().filter((g) => g.isFeatured);
  },

  getRecommended(): CatalogGame[] {
    return this.getAll().filter((g) => g.isRecommended);
  },

  getRecentlyPlayed(ids: string[]): CatalogGame[] {
    if (!ids || ids.length === 0) return [];
    return ids
      .map((id) => this.getById(id))
      .filter((g): g is CatalogGame => Boolean(g));
  },

  search(query: string): CatalogGame[] {
    if (!query.trim()) return this.getAll();
    const q = query.toLowerCase().trim();
    return this.getAll().filter(
      (g) =>
        g.gameName.toLowerCase().includes(q) ||
        g.titleAmharic.includes(query) ||
        g.category.toLowerCase().includes(q) ||
        g.tagline.toLowerCase().includes(q) ||
        g.genre.toLowerCase().includes(q)
    );
  },
};
