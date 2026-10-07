/**
 * Canonical Content Source of Truth - GOPLAY_GAMES_CONTENT
 * Supplies text and structured rule breakdowns for all 12 games.
 */

export interface GameContentDetails {
  id: string;
  name: string;
  genre: string;
  competitionCycle: 'weekly' | 'monthly';
  overview: string;
  howToPlay: string[];
  skillFocus: string[];
  gameDuration?: string;
  gameDurationNotes?: string[];
  difficultyProgression?: { range: string; activeBalloons: string; speed: string; diameter: string }[];
  balloonColors?: { name: string; hex: string }[];
  visualDirection?: string;
  visualRule?: string;
  importantRules?: string[];
}

export const GOPLAY_GAMES_CONTENT: GameContentDetails[] = [
  {
    id: 'crazy-colors',
    name: 'Crazy Color',
    genre: 'Arcade',
    competitionCycle: 'weekly',
    overview: 'The definitive 40-level Crazy Colors experience based on authentic color-matching physics. Tap to bounce against gravity, time passes through matching neon segments, collect stars, and become the Grandmaster!',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'juicy-match',
    name: 'Candy Juicy',
    genre: 'Puzzle',
    competitionCycle: 'weekly',
    overview: 'A vibrant and juicy Match-3 puzzle adventure. Swap 3D strawberries, blueberries, kiwi slices, bananas, and grapes to shatter crates, uncover treasure chests, and unleash Rainbow Bomb combos across 40 challenging tropical levels.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'emoji-fun',
    name: 'EMOJI FUN',
    genre: 'Puzzle',
    competitionCycle: 'weekly',
    overview: 'The official EMOJI FUN tournament puzzle arena. Solve 15 unique emoji puzzle categories across 40 levels with dynamic skill-based scoring, combos, hints, lives, store, and competitive leaderboard.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'pop-piano',
    name: 'Pop Piano',
    genre: 'Music',
    competitionCycle: 'weekly',
    overview: 'Fast rhythm piano tile gameplay featuring popular songs, acoustic chords, and global hits. Tap descending piano tiles in sync with the beat to achieve perfect harmony.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'world-legends',
    name: 'Word Legend',
    genre: 'Puzzle',
    competitionCycle: 'weekly',
    overview: 'An immersive knowledge and trivia adventure. Answer intriguing questions on world civilizations, ancient mythology, Ethiopian imperial heritage, and legendary world events.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'candy-blast',
    name: 'Candy Crush',
    genre: 'Puzzle',
    competitionCycle: 'weekly',
    overview: 'A delightful confectionery match-3 puzzle. Swap and connect 3 or more delicious honey candies to trigger colorful cascades, sweet sugar blasts, and massive combo multipliers.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'soccer-shooter',
    name: 'Soccer Shooter',
    genre: 'Sports',
    competitionCycle: 'weekly',
    overview: 'The championship edition of Soccer Shooter. Aim the precision dotted trajectory guide from the penalty spot, bank shots off stadium walls, trigger massive goalmouth cluster drops (+250 PTS), and manage penalty fouls.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'dama',
    name: 'Dama',
    genre: 'Board',
    competitionCycle: 'weekly',
    overview: 'Single-player 3D Draughts (Dama) against an advanced computer opponent. Experience physical wooden pieces, realistic board depth, mandatory captures, multi-jumps, and king crowning across progressive challenges.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'button-soccer',
    name: 'Button Soccer',
    genre: 'Sports',
    competitionCycle: 'weekly',
    overview: 'The authentic 2026 World Tour button soccer tournament. Choose your nation, drag back from your 3D team discs to aim & power, score against very difficult AI opponents, and conquer 40 championship levels with pass-and-play 2-player mode.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'soccer-ping-pong',
    name: 'Soccer Ping Pong',
    genre: 'Sports',
    competitionCycle: 'weekly',
    overview: 'Control a high-velocity 3D soccer ball in fast-paced table tennis rallies against tactical AI opponents. Execute precision volleys, curve spins, power smashes, and obstacle rebounds across 6 progressive stadiums.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'bubble-sort',
    name: 'BUBBLE SORT',
    genre: 'Puzzle',
    competitionCycle: 'weekly',
    overview: 'An underwater tournament puzzle challenge inspired by the official video reference. Tap floating glass bubbles to merge related words into colorful category clusters. Watch bubbles transform from single words to Green (2 words), Purple (3 words), and Orange (Category complete), then burst into magnificent splash particles. Features 40 hard tournament levels, move limits, wisdom rewards, and the Extra Bubbles booster.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  },
  {
    id: 'color-tap-sprint',
    name: 'COLOR TAP SPRINT',
    genre: 'Arcade',
    competitionCycle: 'weekly',
    overview: 'The official Color Tap Sprint tournament game. Follow the prompt "TAP THE CARD COLOR" and strike the card whose background color matches the target. Avoid tricky Stroop word decoys, maintain combo streaks, earn time bonuses, and utilize Focus boosters to conquer 40 increasingly hard tournament levels.',
    howToPlay: [
      'Launch the game from the portal.',
      'Master the touch or mouse controls to conquer challenges.',
      'Achieve high scores to claim tournament prizes and top the leaderboards.'
    ],
    skillFocus: ['Hand-eye coordination', 'Reflex timing', 'Strategy', 'Precision']
  }
];
