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
    question: 'What is GoPlay?',
    answer: 'GoPlay is a telebirr SuperApp gaming entertainment service providing competitive tournament matches and instant free passes.'
  },
  {
    id: 'faq-2',
    question: 'What games are available?',
    answer: 'GoPlay offers 12 competitive, tournament, and arcade games including Crazy Color, Candy Juicy, Pop Piano, and Soccer Shooter.'
  },
  {
    id: 'faq-3',
    question: 'How do tournaments work?',
    answer: 'Enter the Crazy Color weekly tournament using 2 coins. Top performers win telebirr cash prizes and airtime.'
  },
  {
    id: 'faq-4',
    question: 'Are other games free to play?',
    answer: 'Yes! All non-tournament games are permanent free passes for all registered users.'
  },
  {
    id: 'faq-5',
    question: 'How do I buy coins?',
    answer: 'Click the + button next to your coins balance in the header to purchase coin packages directly via your telebirr wallet.'
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
    title: 'Gameplay & Scoring',
    content: [
      'Scores are automatically synchronized with the authoritative database.',
      'Tournament scores are ranked by highest single-round score achieved during the active weekly cycle.'
    ]
  },
  {
    id: 'payment-help',
    title: 'Telebirr Payments & Topups',
    content: [
      'Coins are credited instantly upon successful telebirr C2B wallet confirmation.',
      'If you experience payment delays, refresh the application or contact telebirr customer care.'
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
