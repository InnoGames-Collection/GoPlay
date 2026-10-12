/**
 * GoPlay - Tournament Reward & Settlement Client
 * Real tournament cash rewards are disbursed automatically via Telebirr B2C
 * through the server-side settlement engine (tournamentSettlementService.ts).
 */

import { ClaimableReward, UserProfile } from '../types';
import { StorageService } from './storageService';

const STORAGE_KEYS = {
  CLAIMABLE_REWARDS: 'goplay_claimable_rewards_v1',
};

const DEFAULT_CLAIMABLE_REWARDS: ClaimableReward[] = [];

export const RewardService = {
  getClaimableRewards(): ClaimableReward[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLAIMABLE_REWARDS);
      if (!stored) {
        return DEFAULT_CLAIMABLE_REWARDS;
      }
      return JSON.parse(stored);
    } catch {
      return DEFAULT_CLAIMABLE_REWARDS;
    }
  },

  saveClaimableRewards(rewards: ClaimableReward[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CLAIMABLE_REWARDS, JSON.stringify(rewards));
    } catch (e) {
      console.warn('[RewardService] Failed to save claimable rewards:', e);
    }
  },

  async claimReward(
    rewardId: string,
    profile: UserProfile
  ): Promise<{ success: boolean; message: string; updatedReward?: ClaimableReward; updatedProfile?: UserProfile }> {
    const all = this.getClaimableRewards();
    const target = all.find((r) => r.id === rewardId);

    if (!target) {
      return { 
        success: false, 
        message: 'No pending manual claim required. Tournament winnings are disbursed automatically to your Telebirr wallet at cycle settlement.' 
      };
    }

    return {
      success: true,
      message: 'Tournament payouts are processed authoritatively by Telebirr B2C gateway.',
      updatedReward: target,
      updatedProfile: profile,
    };
  },
};
