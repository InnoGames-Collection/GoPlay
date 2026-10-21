/**
 * GoPlay Content Compatibility & Support/FAQ/Privacy Provider
 */

import { GOPLAY_GAMES_CONTENT, GameContentDetails } from './goplayContent';

export type { GameContentDetails };
export { GOPLAY_GAMES_CONTENT };
export const TELEPLUS_GAMES_CONTENT = GOPLAY_GAMES_CONTENT;

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export const TELEPLUS_FAQ_ITEMS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How do I start and exit games?',
    answer: 'To start any game, browse the Games tab or Home catalog and tap "Play". To pause or exit during play, tap the Pause or Back button in the top navigation bar of the game. Choosing to exit saves your earned points and attempt history safely.',
    category: 'Gameplay'
  },
  {
    id: 'faq-2',
    question: 'How do level progression, unlocks, and retries work?',
    answer: 'As you complete each level, the next level unlocks automatically. If you do not pass a level, you can tap "Retry" to attempt it again without penalties or coin deductions. Unlocked levels remain unlocked across sessions.',
    category: 'Progression'
  },
  {
    id: 'faq-3',
    question: 'How are points and high scores calculated and saved?',
    answer: 'Points are calculated based on active gameplay achievements (matches, goals, accuracy, or level completions). Every completed or interrupted game session saves its final score to your Profile. If your new score exceeds your personal record, your All-Time Best score updates automatically. Lower scores never replace higher ones.',
    category: 'Scoring'
  },
  {
    id: 'faq-4',
    question: 'How do tournament scores differ from practice scores?',
    answer: 'Crazy Color weekly tournament matches use 2 coins per entry and submit your best single-run score to the public leaderboard for telebirr cash prizes and airtime. Casual play in other games records to your personal high score board and attempt history without requiring coins.',
    category: 'Tournaments'
  },
  {
    id: 'faq-5',
    question: 'What happens when the app is backgrounded or switched?',
    answer: 'When GoPlay is backgrounded or when you switch tabs/apps, the game simulation automatically pauses, all countdown timers freeze, and audio sound effects are immediately suspended. No game time or moves are lost.',
    category: 'Technical'
  },
  {
    id: 'faq-6',
    question: 'How do I return to an interrupted game session?',
    answer: 'When you return to GoPlay after switching apps, tap "Resume" on the pause overlay to pick up exactly where you left off. If you explicitly choose to exit or close the launcher, your valid earned score up to that point is preserved in your attempt history.',
    category: 'Gameplay'
  },
  {
    id: 'faq-7',
    question: 'What should I do if a game freezes or controls stop responding?',
    answer: 'Tap the Back icon in the top header or your device back button to return to the GoPlay portal, then relaunch the game. You can also refresh your browser page; your saved progression, coins, and high scores remain securely preserved in your account.',
    category: 'Troubleshooting'
  },
  {
    id: 'faq-8',
    question: 'How do I toggle game sound effects and music?',
    answer: 'Go to the Profile tab and use the "Game Sound Effects" toggle switch to enable or mute audio across all GoPlay titles. Audio is also muted automatically whenever the app is minimized or backgrounded.',
    category: 'Settings'
  },
  {
    id: 'faq-9',
    question: 'How do I access my Profile, high scores, and attempt history?',
    answer: 'Tap the Profile tab in the bottom navigation bar, or select "My High Scores" from the top menu. You will see both your "All-Time Best" records across all 12 games and your "Recent Attempts" with outcomes (Completed, Failed, Interrupted), active durations, and timestamps.',
    category: 'Account'
  },
  {
    id: 'faq-10',
    question: 'How do I log out safely?',
    answer: 'Open the top menu or scroll to the bottom of the Profile tab and tap "Log Out". A confirmation dialog will appear. Confirming will clear your active login session and return you to guest mode while keeping your saved progression and high scores intact on your device.',
    category: 'Account'
  },
  {
    id: 'faq-11',
    question: 'How do I report a problem or submit feedback?',
    answer: 'Navigate to the Help & Support page from the top menu or Profile tab to find troubleshooting guides. For billing inquiries or technical issues, contact EthioTelecom / telebirr customer support at 994 or reach out via official support channels.',
    category: 'Support'
  },
  {
    id: 'faq-12',
    question: 'What are the subscription and coin billing rules?',
    answer: 'Coins are purchased using your telebirr digital wallet with instant verification. Daily/weekly VIP passes provide unlimited tournament entries. Free catalog games require zero coins to play. Coin purchases are non-transferable and linked to your phone number.',
    category: 'Billing'
  },
  {
    id: 'faq-13',
    question: 'What is GoPlay’s policy on privacy and account data?',
    answer: 'GoPlay protects user privacy by masking all mobile numbers (MSISDN) on public leaderboards. No personal contacts or external data are accessed. You can review our full Privacy Policy and Terms of Service in the Profile tab.',
    category: 'Privacy'
  }
];

export const GOPLAY_FAQ_ITEMS = TELEPLUS_FAQ_ITEMS;

export interface SupportTopic {
  id: string;
  title: string;
  content: string[];
  steps?: string[];
  note?: string;
}

export const TELEPLUS_SUPPORT_TOPICS: SupportTopic[] = [
  {
    id: 'gameplay-help',
    title: 'Gameplay, Scoring & Attempt History',
    content: [
      'Every game in the GoPlay catalog calculates points based on actual verified gameplay milestones.',
      'Completed, failed, and interrupted runs are recorded in your Recent Attempt History without reducing your saved high score.',
      'Tournament scores are ranked by highest single-round score achieved during the active weekly cycle.'
    ],
    steps: [
      'Select any game from the catalog to launch instant play.',
      'Check your personal records at any time under Profile > My High Scores.',
      'Scores sync automatically upon match completion or pause-exit.'
    ]
  },
  {
    id: 'lifecycle-help',
    title: 'Backgrounding, Audio & Lifecycle Recovery',
    content: [
      'When you switch apps, answer a phone call, or minimize the browser, GoPlay automatically suspends active game simulation.',
      'All Web Audio sound effects and background music pause instantly to save battery and prevent unwanted sound.',
      'Returning to the app restores the pause screen so you can resume without losing your progress.'
    ]
  },
  {
    id: 'progression-help',
    title: 'Level Progression & Retry Rules',
    content: [
      'Arcade and puzzle games feature structured level progression with guaranteed passable configurations.',
      'If you run out of moves or fail a level, you can retry immediately with full resources.'
    ]
  },
  {
    id: 'payment-help',
    title: 'Telebirr Payments & Instant Coin Topups',
    content: [
      'Coins are credited instantly upon successful telebirr C2B wallet confirmation.',
      'If you experience payment delays, refresh the application or check your telebirr transaction history.',
      'Direct carrier billing requires sufficient telebirr account balance.'
    ],
    steps: [
      'Tap the "+" button next to your Coin balance.',
      'Select your desired coin package (10, 25, 60, or 150 coins).',
      'Authorize payment securely via telebirr PIN prompt.'
    ]
  },
  {
    id: 'account-help',
    title: 'Account Security & Safe Logout',
    content: [
      'Logging out returns you to guest status while preserving all your saved high scores, recent attempt records, and game progression on your device.',
      'Logging back in with your mobile number instantly re-links your telebirr wallet and profile.'
    ]
  },
  {
    id: 'troubleshoot-help',
    title: 'Freeze Recovery & Browser Troubleshooting',
    content: [
      'If an animation freezes or controls become unresponsive due to network fluctuations, tap the portal Back button or refresh your browser.',
      'GoPlay is optimized for modern mobile WebViews with hardware acceleration enabled.'
    ]
  }
];

export const GOPLAY_SUPPORT_TOPICS = TELEPLUS_SUPPORT_TOPICS;

export const TELEPLUS_PRIVACY_POLICY: {
  title: string;
  summary: string;
  sections: { title: string; paragraphs: string[]; bulletPoints?: string[] }[];
} = {
  title: 'GoPlay Privacy Policy',
  summary: 'We value your privacy. All phone numbers are masked on public leaderboards, and authorization is secured via telebirr SSO.',
  sections: [
    {
      title: 'Identity Protection',
      paragraphs: ['Your MSISDN is masked as 091*****890 on public rankings to guarantee user privacy.'],
      bulletPoints: ['No unmasked numbers shown', 'Strict customer privacy']
    },
    {
      title: 'Data Security',
      paragraphs: ['All sessions are signed with server-authoritative HMAC-SHA256 tokens to prevent tampering.'],
      bulletPoints: ['Anti-cheat HMAC token validation', 'Secure TLS encryption']
    }
  ]
};

export const GOPLAY_PRIVACY_POLICY = TELEPLUS_PRIVACY_POLICY;

export interface TermSection {
  number: string;
  title: string;
  paragraphs: string[];
  bulletPoints?: string[];
  table?: { col1: string; col2: string }[];
}

export const TELEPLUS_TERMS_SECTIONS: TermSection[] = [
  {
    number: '1.0',
    title: 'Terms of Service',
    paragraphs: ['By using GoPlay, you agree to these fair-play and tournament rules.']
  }
];

export const GOPLAY_TERMS_SECTIONS = TELEPLUS_TERMS_SECTIONS;
