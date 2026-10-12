/**
 * GoPlay - Production Portal Configuration & Reward Ladders
 * Canonical definitions for daily login streaks and partner showcase placements.
 */

import { DailyRewardItem } from '../types';

export const DAILY_REWARD_LADDER: DailyRewardItem[] = [
  { day: 1, coins: 10, energy: 1, badge: 'Day 1 Boost' },
  { day: 2, coins: 15, energy: 1, badge: 'Double Spark' },
  { day: 3, coins: 20, energy: 2, badge: 'Streak Power' },
  { day: 4, coins: 25, energy: 2, badge: 'Bronze Rank' },
  { day: 5, coins: 35, energy: 3, badge: 'Silver Tier' },
  { day: 6, coins: 50, energy: 3, badge: 'Gold Rush' },
  { day: 7, coins: 100, energy: 5, badge: 'Grandmaster Chest', special: true },
];

export const TELEBIRR_SPONSOR_ADS = [
  {
    id: 'ad_telebirr_superapp',
    brand: 'telebirr SuperApp',
    tagline: 'Simple, Fast & Secure Mobile Payments',
    rewardText: '+2 Energy Hearts Refill',
    durationSeconds: 5,
    accentColor: '#1688C9',
  },
  {
    id: 'ad_telebirr_c2b',
    brand: 'telebirr Quick Pay',
    tagline: 'Direct Carrier Billing for Competitive Tournaments',
    rewardText: '+2 Energy Hearts Refill',
    durationSeconds: 5,
    accentColor: '#8BCB3D',
  },
  {
    id: 'ad_ethiotelecom_4g',
    brand: 'EthioTelecom 4G LTE Advanced',
    tagline: 'High-Speed Ultra-Low Latency Mobile Gaming',
    rewardText: '+2 Energy Hearts Refill',
    durationSeconds: 5,
    accentColor: '#0057A8',
  },
];

/**
 * Pre-seeded INSA Demo Personas for Verification Testing
 * Configurable via VITE_DEMO_PHONE_VIP and VITE_DEMO_PHONE_FREE
 */
export interface DemoPersona {
  id: 'vip' | 'free';
  phone: string;
  name: string;
  description: string;
  badge: string;
}

export const DEMO_TEST_PERSONAS: DemoPersona[] = [
  {
    id: 'vip',
    phone: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_PHONE_VIP) || '0977057270',
    name: 'VIP Subscriber Persona',
    description: 'Active subscription, 100 coins pre-funded in DB',
    badge: 'VIP ACTIVE',
  },
  {
    id: 'free',
    phone: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEMO_PHONE_FREE) || '0911998890',
    name: 'Standard Free Player Persona',
    description: 'Free tier, 100 coins pre-funded in DB',
    badge: 'FREE TIER',
  },
];
