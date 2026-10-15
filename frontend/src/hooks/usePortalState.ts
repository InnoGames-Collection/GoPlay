/**
 * Central State Hook for TelePlay Ethiopia
 * Orchestrates user profile, energy timers, modal visibility, game launching,
 * subscriptions, rewards, Google AdMob lifecycle, and multi-language dictionary.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  NavigationTab, 
  UserProfile, 
  LanguageCode, 
  GameDefinition, 
  Tournament, 
  ToastMessage, 
  RewardedAdState,
  InterstitialAdState,
  GameSessionResult,
  SubscriptionPlan,
  EnergyTransaction,
  ClaimableReward
} from '../types';
import { StorageService } from '../services/storageService';
import { TRANSLATIONS } from '../utils/translations';
import { GameBridgeService } from '../services/gameBridge';
import { SubscriptionService } from '../services/subscriptionService';
import { AuthService } from '../services/authService';
import { AdMobService } from '../services/adMobService';
import { PaymentService } from '../services/paymentService';
import { RewardService } from '../services/rewardService';
import { DAILY_REWARD_LADDER } from '../data/portalConfig';
import { apiService } from '../services/apiService';
import { GameCatalog } from '../services/gameCatalog';

export function usePortalState() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [profile, setProfile] = useState<UserProfile>(() => StorageService.getProfile());
  const [language, setLanguage] = useState<LanguageCode>(() => StorageService.getLanguage());
  
  // Modals state
  const [activeGameToLaunch, setActiveGameToLaunch] = useState<GameDefinition | null>(null);
  const [activeTournamentId, setActiveTournamentId] = useState<string | undefined>(undefined);
  const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isDailyRewardModalOpen, setIsDailyRewardModalOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [lastGameSessionResult, setLastGameSessionResult] = useState<GameSessionResult | null>(null);
  const [activeSession, setActiveSession] = useState<{ sessionId: string; token: string; startTime: number } | null>(null);

  // Legal & Privacy modal
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'terms' | 'privacy' | 'datasafety' | 'delete_account'>('terms');

  // Rewarded Ad state
  const [rewardedAdState, setRewardedAdState] = useState<RewardedAdState>({
    isOpen: false,
    adId: '',
    brand: '',
    durationSeconds: 5,
    rewardType: 'energy',
    rewardAmount: 2,
    onRewardClaimed: () => {},
  });

  // Interstitial Ad state
  const [interstitialAdState, setInterstitialAdState] = useState<InterstitialAdState>({
    isOpen: false,
    adId: '',
    brand: '',
    durationSeconds: 3,
    onAdClosed: () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Settings
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => StorageService.getAudioEnabled());
  const [hapticsEnabled, setHapticsEnabled] = useState<boolean>(() => StorageService.getHapticsEnabled());
  const [notifsEnabled, setNotifsEnabled] = useState<boolean>(() => StorageService.getNotificationsEnabled());
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => StorageService.getLowDataMode());

  // Energy & Rewards state
  const [energyTransactions, setEnergyTransactions] = useState<EnergyTransaction[]>(() =>
    StorageService.getEnergyTransactions()
  );
  const [claimableRewards, setClaimableRewards] = useState<ClaimableReward[]>(() =>
    RewardService.getClaimableRewards()
  );

  // Language dictionary helper
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  const showToast = useCallback((type: ToastMessage['type'], title: string, description?: string) => {
    // Under Part 1 specification: Suppress all application-generated toasts/popups. Pure internal event logging.
    console.info(`[GoPlay Event] ${type}: ${title}`, description || '');
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Energy auto-refill interval
  useEffect(() => {
    const interval = setInterval(() => {
      setProfile((curr) => {
        const updated = StorageService.recalculateEnergy(curr);
        return updated;
      });
    }, 15000); // check every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Synchronize with Authoritative Backend (Telebirr SSO & Profile Sync)
  useEffect(() => {
    async function initAuthoritativeAuth() {
      try {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const msisdn = params.get('msisdn') || params.get('phoneNumber') || undefined;
        const token = params.get('token') || undefined;

        if (msisdn || token) {
          const serverProfile = await apiService.loginWithTelebirr(msisdn, token);
          if (serverProfile) {
            setProfile(serverProfile);
            StorageService.saveProfile(serverProfile);
            return;
          }
        }

        if (apiService.getToken()) {
          const serverProfile = await apiService.getProfile();
          if (serverProfile) {
            setProfile(serverProfile);
            StorageService.saveProfile(serverProfile);
          }
        }

        // Dynamically sync 12-game catalog rules (fees, coin requirements) with PostgreSQL
        await GameCatalog.syncWithBackend();
      } catch (err) {
        console.warn('[usePortalState] Error synchronizing profile with backend:', err);
      }
    }

    initAuthoritativeAuth();
  }, []);

  // Change Language
  const changeLanguage = useCallback((newLang: LanguageCode) => {
    setLanguage(newLang);
    StorageService.saveLanguage(newLang);
  }, []);

  // Toggle Preferences
  const toggleAudio = useCallback(() => {
    setAudioEnabled((prev) => {
      const next = !prev;
      StorageService.saveAudioEnabled(next);
      return next;
    });
  }, []);

  const toggleHaptics = useCallback(() => {
    setHapticsEnabled((prev) => {
      const next = !prev;
      StorageService.saveHapticsEnabled(next);
      return next;
    });
  }, []);

  const toggleNotifs = useCallback(() => {
    setNotifsEnabled((prev) => {
      const next = !prev;
      StorageService.saveNotificationsEnabled(next);
      return next;
    });
  }, []);

  const toggleLowDataMode = useCallback(() => {
    setLowDataMode((prev) => {
      const next = !prev;
      StorageService.saveLowDataMode(next);
      return next;
    });
  }, []);

  // Open Legal Modals
  const openLegalModal = useCallback((tab: 'terms' | 'privacy' | 'datasafety' | 'delete_account' = 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  }, []);

  // Launch Game Handler
  const launchGame = useCallback(async (game: GameDefinition, tournamentId?: string) => {
    const isTournament = Boolean(tournamentId);
    
    // 1. Authoritative PostgreSQL tournament entry deduction for tournament mode only
    if (isTournament && (game.entryCostCoins > 0 || game.requiresCoins || !game.isFree)) {
      const targetTournId = tournamentId || 'tourn_crazy_colors_01';
      const deductRes = await apiService.enterTournament(targetTournId);
      
      if (!deductRes?.success) {
        setIsEnergyModalOpen(true);
        return;
      }
      
      if (deductRes.remainingCoins !== undefined) {
        setProfile((curr) => {
          const upd = { ...curr, coins: deductRes.remainingCoins! };
          StorageService.saveProfile(upd);
          return upd;
        });
      }
    } else {
      const check = GameBridgeService.canLaunchGame(game, profile);
      if (!check.allowed) {
        if (check.requiresAuth) {
          setIsAuthModalOpen(true);
        } else if (check.requiresCoins) {
          setIsEnergyModalOpen(true);
        } else if (check.requiresSubscription) {
          setIsSubscriptionModalOpen(true);
        }
        return;
      }
    }

    // 2. Pre-acquire authoritative session token from server BEFORE launching
    try {
      const sessionRes = await apiService.startSession(game.id, tournamentId);
      if (sessionRes?.sessionId && sessionRes?.sessionToken) {
        setActiveSession({
          sessionId: sessionRes.sessionId,
          token: sessionRes.sessionToken,
          startTime: Date.now(),
        });
      }
    } catch (err) {
      console.warn('[usePortalState] Session start warning:', err);
    }

    setActiveGameToLaunch(game);
    setActiveTournamentId(tournamentId);
    setLastGameSessionResult(null);
  }, [profile]);

  // Submit Game Results
  const handleGameFinished = useCallback((finalScore: number, durationSeconds: number) => {
    if (!activeGameToLaunch) return;

    const { result, updatedProfile } = GameBridgeService.submitScore(
      activeGameToLaunch.id,
      finalScore,
      durationSeconds,
      profile,
      activeTournamentId
    );

    setProfile(updatedProfile);
    setLastGameSessionResult(result);

    // Authoritative backend score submission to PostgreSQL with pre-acquired session token
    apiService.submitScore(
      activeGameToLaunch.id,
      finalScore,
      durationSeconds,
      activeTournamentId,
      activeSession ? { sessionId: activeSession.sessionId, token: activeSession.token } : undefined
    ).then((res) => {
      if (res?.updatedProfile) {
        setProfile(res.updatedProfile);
        StorageService.saveProfile(res.updatedProfile);
      }
    }).catch((err) => {
      console.warn('[usePortalState] Failed to submit score to backend:', err);
    });

    setActiveSession(null);
  }, [activeGameToLaunch, activeTournamentId, activeSession, profile]);

  // Close Game Runner
  const closeGameLauncher = useCallback(() => {
    setActiveGameToLaunch(null);
    setActiveTournamentId(undefined);
    setActiveSession(null);
    setLastGameSessionResult(null);
  }, []);

  // Trigger Rewarded Ad
  const triggerRewardedAd = useCallback((
    rewardType: 'energy' | 'coins' = 'energy',
    rewardAmount: number = 2,
    onSuccess: () => void = () => {}
  ) => {
    const offer = AdMobService.getRandomRewardedOffer(rewardType);
    setRewardedAdState({
      isOpen: true,
      adId: offer.id,
      brand: offer.brand,
      durationSeconds: 5,
      rewardType,
      rewardAmount,
      onRewardClaimed: () => {
        onSuccess();
        setRewardedAdState((s) => ({ ...s, isOpen: false }));
        if (rewardType === 'energy') {
          apiService.claimAdReward(offer.id).then((res) => {
            if (res.success && res.profile) {
              setProfile(res.profile);
              StorageService.saveProfile(res.profile);
            }
          }).catch(() => {
            setProfile((curr) => {
              const nextEnergy = Math.min(curr.maxEnergy, curr.energy + rewardAmount);
              const upd = { ...curr, energy: nextEnergy };
              StorageService.saveProfile(upd);
              return upd;
            });
          });
        }
      },
    });
  }, []);

  // Purchase Energy Package via PaymentService
  const purchaseEnergyPackage = useCallback(async (
    energyAmount: number, 
    costETB: number
  ): Promise<{ success: boolean; message: string }> => {
    if (!profile.isRegistered || !profile.telebirrLinked) {
      setIsAuthModalOpen(true);
      return { success: false, message: 'Please sign in with your EthioTelecom phone number to pay via TeleBirr.' };
    }

    const payResult = await PaymentService.processPayment(profile, {
      method: 'TELEBIRR',
      amountETB: costETB,
      itemType: 'ENERGY_PACK',
      itemTitle: `${energyAmount} Energy Points Pack`,
    });

    if (payResult.status === 'SUCCESS') {
      const updated: UserProfile = {
        ...profile,
        telebirrBalance: Number((profile.telebirrBalance - costETB).toFixed(2)),
        energy: profile.energy + energyAmount,
        maxEnergy: Math.max(profile.maxEnergy, profile.energy + energyAmount),
        lastEnergyRefillTimestamp: Date.now(),
      };

      setProfile(updated);
      StorageService.saveProfile(updated);

      // Record Energy Transaction
      const energyTx: EnergyTransaction = {
        transactionId: payResult.transaction.transactionId,
        type: 'PURCHASE_TELEBIRR',
        amount: energyAmount,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED',
        details: `TeleBirr Purchase (${costETB} ETB)`,
      };
      StorageService.recordEnergyTransaction(energyTx);
      setEnergyTransactions(StorageService.getEnergyTransactions());

      return { success: true, message: `Successfully purchased ${energyAmount} Energy for ${costETB} ETB.` };
    } else {
      return { success: false, message: payResult.message };
    }
  }, [profile]);

  // TeleBirr Instant Energy Refill
  const refillEnergyViaTelebirr = useCallback(() => {
    purchaseEnergyPackage(10, 3.0);
    setIsEnergyModalOpen(false);
  }, [purchaseEnergyPackage]);

  // Daily Streak Claim (Server-Authoritative in PostgreSQL)
  const claimDailyStreak = useCallback(async () => {
    if (profile.streak.hasClaimedToday) {
      return;
    }

    try {
      const res = await apiService.claimDailyStreak();
      if (res.success && res.profile) {
        setProfile(res.profile);
        StorageService.saveProfile(res.profile);
      }
    } catch (e: any) {
      console.warn('[usePortalState] Could not claim daily streak reward:', e);
    }
  }, [profile]);

  // Claim Reward Prize
  const handleClaimReward = useCallback(async (rewardId: string) => {
    const res = await RewardService.claimReward(rewardId, profile);
    if (res.success && res.updatedProfile) {
      setProfile(res.updatedProfile);
      setClaimableRewards(RewardService.getClaimableRewards());
    }
  }, [profile]);

  // Subscribe to VIP Pass via Telebirr Gateway
  const handleSubscribe = useCallback(async (plan: SubscriptionPlan) => {
    try {
      const res = await apiService.activateSubscription(plan as any);
      if (res.success) {
        if (res.checkoutUrl) {
          window.location.href = res.checkoutUrl!;
          return;
        }
        const fresh = await apiService.getProfile();
        if (fresh) {
          setProfile(fresh);
          StorageService.saveProfile(fresh);
        }
        setIsSubscriptionModalOpen(false);
      }
    } catch (err: any) {
      console.warn('[usePortalState] Could not connect to subscription gateway:', err);
    }
  }, []);

  // Reset Demo State
  const resetDemoState = useCallback(() => {
    const reset = StorageService.resetDemoState();
    setProfile(reset);
    setEnergyTransactions(StorageService.getEnergyTransactions());
    setClaimableRewards(RewardService.getClaimableRewards());
  }, []);

  // Wipe Account Data Completely
  const wipeAccountData = useCallback(() => {
    const freshGuest = StorageService.wipeAllData();
    setProfile(freshGuest);
    setEnergyTransactions([]);
    setClaimableRewards([]);
  }, []);

  // Sign out / Sign in
  const signOut = useCallback(() => {
    const guest = AuthService.signOut();
    setProfile(guest);
  }, []);

  return {
    activeTab,
    setActiveTab,
    profile,
    setProfile,
    language,
    changeLanguage,
    t,
    // Modals
    activeGameToLaunch,
    launchGame,
    closeGameLauncher,
    handleGameFinished,
    lastGameSessionResult,
    isEnergyModalOpen,
    setIsEnergyModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    isDailyRewardModalOpen,
    setIsDailyRewardModalOpen,
    selectedTournament,
    setSelectedTournament,
    rewardedAdState,
    triggerRewardedAd,
    setRewardedAdState,
    interstitialAdState,
    setInterstitialAdState,
    isLegalModalOpen,
    setIsLegalModalOpen,
    legalModalTab,
    openLegalModal,
    // Actions & Ledgers
    energyTransactions,
    claimableRewards,
    handleClaimReward,
    purchaseEnergyPackage,
    refillEnergyViaTelebirr,
    claimDailyStreak,
    handleSubscribe,
    resetDemoState,
    wipeAccountData,
    signOut,
    // Settings & Toasts
    audioEnabled,
    toggleAudio,
    hapticsEnabled,
    toggleHaptics,
    notifsEnabled,
    toggleNotifs,
    lowDataMode,
    toggleLowDataMode,
    toasts,
    showToast,
    dismissToast,
  };
}
