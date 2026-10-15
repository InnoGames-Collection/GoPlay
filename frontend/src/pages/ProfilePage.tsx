/**
 * GameON Tele - Customer Profile & Account Page
 * 
 * Compliant with GameON Tele guidelines:
 * - NO customer login screen: User is pre-authenticated by telebirr SuperApp
 * - telebirr Identity: MSISDN, telebirr balance, GameON coin balance
 * - In-app Coin Topup & All-Access Subscription Management
 * - Game History & Personal High Scores
 * - Clean, responsive UI with zero shortcode dependencies
 */

import React, { useState, useMemo } from 'react';
import { 
  UserProfile, 
  GameDefinition, 
  EnergyTransaction, 
  ClaimableReward,
  LanguageCode 
} from '../types';
import { 
  User, 
  Phone, 
  Coins, 
  Gamepad2, 
  Trophy, 
  Gift, 
  Crown, 
  CreditCard, 
  Headphones, 
  HelpCircle, 
  Settings as SettingsIcon, 
  Info, 
  FileText, 
  ShieldCheck, 
  ArrowLeft, 
  ChevronRight, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Plus
} from 'lucide-react';
import { GamesContentPage } from './content/GamesContentPage';
import { PricingPage } from './content/PricingPage';
import { FAQPage } from './content/FAQPage';
import { HelpSupportPage } from './content/HelpSupportPage';
import { SubscriptionPage } from './content/SubscriptionPage';
import { TermsPage } from './content/TermsPage';
import { PrivacyPage } from './content/PrivacyPage';
import { EntitlementService } from '../services/entitlementService';
import { GameCatalog } from '../services/gameCatalog';
import { catalogGameToDefinition } from '../games/registry';
import { GoPlayLogo } from '../components/GoPlayLogo';
import { TournamentService } from '../services/tournamentService';

export type ProfileSubView =
  | null
  | 'games'
  | 'pricing'
  | 'my_games'
  | 'my_scores'
  | 'my_rewards'
  | 'my_rank'
  | 'subscriptions'
  | 'help_support'
  | 'faq'
  | 'settings'
  | 'about'
  | 'terms'
  | 'privacy';

interface ProfilePageProps {
  profile: UserProfile;
  games: GameDefinition[];
  energyTransactions?: EnergyTransaction[];
  claimableRewards?: ClaimableReward[];
  language?: LanguageCode;
  onLanguageChange?: (lang: LanguageCode) => void;
  onOpenEnergyModal?: () => void;
  onOpenSubscriptionModal?: () => void;
  onOpenAuthModal?: () => void;
  onPlayGame: (game: GameDefinition) => void;
  onClaimReward?: (rewardId: string) => void;
  onSignOut?: () => void;
  onOpenBuyCoins?: () => void;
  onProfileUpdate?: (updated: UserProfile) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  profile,
  games,
  language = 'en',
  onLanguageChange,
  onPlayGame,
  onOpenBuyCoins,
  onOpenAuthModal,
  onProfileUpdate,
}) => {
  const [subView, setSubView] = useState<ProfileSubView>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Derive real identity strictly from the authenticated carrier session
  const isRegistered = Boolean(profile?.isRegistered && profile?.phoneNumber);
  const phone = profile?.phoneNumber || '';
  const maskedMsisdn = isRegistered && phone.length >= 6
    ? `${phone.slice(0, 3)}*****${phone.slice(-3)}`
    : 'Guest Gamer';
  const accountBadge = isRegistered ? 'VERIFIED' : 'GUEST';
  const coinsBalance = profile?.coins ?? 0;

  // Real Crazy Color tournament best score for the active tournament
  const bestScore = useMemo(() => {
    const tournamentSummary = TournamentService.getTournamentSummary(profile);
    const tournamentScore = tournamentSummary?.currentUserScores?.['crazy-colors'] ?? 0;
    const personalCrazyScore = profile?.highScores?.['crazy-colors'] ?? 0;
    return Math.max(tournamentScore, personalCrazyScore);
  }, [profile]);

  // Played or unlocked games
  const recentlyPlayedIds = EntitlementService.getRecentlyPlayedIds();
  const myGamesList = GameCatalog.getRecentlyPlayed(recentlyPlayedIds).map(catalogGameToDefinition);

  // Active subscriptions count
  const activeSubsCount = EntitlementService.getActiveSubscriptionsList().length;

  // Subview rendering
  if (subView === 'subscriptions') {
    return (
      <SubscriptionPage
        onBack={() => setSubView(null)}
        profile={profile}
        onProfileUpdate={onProfileUpdate}
      />
    );
  }

  if (subView === 'pricing') {
    return (
      <PricingPage
        onBack={() => setSubView(null)}
        onBuyCoins={onOpenBuyCoins}
      />
    );
  }

  if (subView === 'games') {
    return (
      <GamesContentPage
        onBack={() => setSubView(null)}
        onPlayGame={onPlayGame}
      />
    );
  }

  if (subView === 'terms') {
    return <TermsPage onBack={() => setSubView(null)} />;
  }

  if (subView === 'privacy') {
    return <PrivacyPage onBack={() => setSubView(null)} />;
  }

  if (subView === 'faq') {
    return <FAQPage onBack={() => setSubView(null)} />;
  }

  if (subView === 'help_support') {
    return <HelpSupportPage onBack={() => setSubView(null)} />;
  }

  if (subView === 'my_games') {
    const allAvailableGames = GameCatalog.getAll().map(catalogGameToDefinition);

    return (
      <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none space-y-4">
        <div className="flex items-center justify-between gap-3 bg-[#102B3F] text-white p-3.5 rounded-2xl shadow-xs border border-[#116B73]/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubView(null)}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <h1 className="text-base font-black tracking-tight">My Games</h1>
          </div>
          <span className="text-xs font-bold text-[#DFF7EA]">
            {allAvailableGames.length} Games
          </span>
        </div>

        <div className="space-y-2.5">
          {allAvailableGames.map((g) => {
            const personalHighScore = profile.highScores?.[g.id] ?? 0;
            return (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#DCE7E8] hover:border-[#087F8C] transition-all shadow-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={g.thumbnailUrl || g.bannerUrl}
                    alt={g.title}
                    className="w-12 h-12 rounded-xl object-cover bg-slate-900 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-[#183345] truncate">{g.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-[#607582] capitalize">{g.category}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[11px] font-extrabold text-[#087F8C]">
                        Best: {personalHighScore > 0 ? `${personalHighScore.toLocaleString()} pts` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onPlayGame(g)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#82C341] hover:bg-[#72af36] active:scale-95 text-white text-xs font-black shrink-0 transition-transform cursor-pointer shadow-xs"
                >
                  Play
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (subView === 'my_scores') {
    const allGames = GameCatalog.getAll();
    const playedCount = Object.keys(profile.highScores || {}).length;

    return (
      <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none space-y-4">
        <div className="flex items-center justify-between gap-3 bg-[#102B3F] text-white p-3.5 rounded-2xl shadow-xs border border-[#116B73]/40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSubView(null)}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <h1 className="text-base font-black tracking-tight">My High Scores</h1>
          </div>
          <span className="text-xs font-bold text-[#DFF7EA]">
            {playedCount} Recorded
          </span>
        </div>

        <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-2xs divide-y divide-[#DCE7E8]">
          {allGames.map((game) => {
            const score = profile.highScores?.[game.gameId] ?? 0;
            return (
              <div key={game.gameId} className="p-3.5 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {game.thumbnailUrl && (
                    <img 
                      src={game.thumbnailUrl} 
                      alt={game.gameName} 
                      className="w-10 h-10 rounded-xl object-cover bg-slate-900 shrink-0" 
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-xs font-black text-[#183345] truncate">
                      {game.gameName}
                    </div>
                    <div className="text-[10px] text-[#607582] capitalize">
                      {game.category}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black font-mono shrink-0">
                  {score > 0 ? (
                    <span className="text-[#087F8C]">{score.toLocaleString()} pts</span>
                  ) : (
                    <span className="text-[#607582] text-xs font-normal">Not Played</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // MAIN PROFILE VIEW
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 space-y-4 select-none">
      
      {/* Official GoPlay Profile Brand Header */}
      <div className="flex flex-col items-center justify-center py-2">
        <GoPlayLogo size="lg" />
      </div>

      {/* 1. TOP: Authenticated GoPlay Profile Card */}
      <div 
        id="profile-account-card"
        className="rounded-3xl bg-[#102B3F] text-white p-4.5 shadow-sm border border-[#116B73]/50"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-xs shrink-0 text-white">
              <User className="w-6 h-6 text-[#DFF7EA]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#DFF7EA] font-black uppercase tracking-wider">
                  GoPlay Account
                </span>
                <span className={`px-1.5 py-0.5 rounded-md text-white text-[8px] font-black uppercase tracking-wider ${
                  isRegistered ? 'bg-[#82C341]' : 'bg-[#E9B949] text-[#183345]'
                }`}>
                  {accountBadge}
                </span>
              </div>
              <div className="text-base font-black font-mono tracking-wider text-white">
                {maskedMsisdn}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="profile-top-up-btn"
              type="button"
              onClick={onOpenBuyCoins}
              className="px-3.5 py-2 rounded-full bg-[#82C341] hover:bg-[#72af36] text-white text-xs font-black flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Top Up</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. STATS: AVAILABLE COINS | BEST SCORE (Two equal-width professional cards) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Available Coins */}
        <div 
          id="profile-stat-available-coins"
          onClick={onOpenBuyCoins}
          className="bg-white rounded-2xl p-4 border border-[#DCE7E8] shadow-2xs hover:border-[#82C341]/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#607582] tracking-wider uppercase">
              Available Coins
            </span>
            <div className="w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Coins className="w-3.5 h-3.5 text-amber-600" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#183345] font-mono">
            {coinsBalance.toLocaleString()}
          </div>
        </div>

        {/* Best Score */}
        <div 
          id="profile-stat-best-score"
          onClick={() => setSubView('my_scores')}
          className="bg-white rounded-2xl p-4 border border-[#DCE7E8] shadow-2xs hover:border-[#087F8C]/50 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-2">
            <span className="text-[10px] sm:text-[11px] font-bold text-[#607582] tracking-wider uppercase">
              Best Score
            </span>
            <div className="w-6 h-6 rounded-full bg-[#DFF7EA] border border-[#087F8C]/20 flex items-center justify-center shrink-0">
              <Trophy className="w-3.5 h-3.5 text-[#087F8C]" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#183345] font-mono flex items-baseline gap-1">
            {bestScore > 0 ? (
              <>
                <span>{bestScore.toLocaleString()}</span>
                <span className="text-xs font-bold text-[#607582] font-sans">pts</span>
              </>
            ) : (
              <span className="text-base font-bold text-[#607582]">0 <span className="text-xs font-sans">pts</span></span>
            )}
          </div>
        </div>
      </div>

      {/* 3. PROFILE MENU ITEMS */}
      <div className="bg-white rounded-2xl border border-[#DCE7E8] shadow-2xs overflow-hidden divide-y divide-[#DCE7E8]">
        {[
          { id: 'subscriptions', label: 'Subscription', icon: CreditCard },
          { id: 'pricing', label: 'Pricing', icon: Coins },
          { id: 'my_games', label: 'My Games', icon: Gamepad2 },
          { id: 'my_scores', label: 'My High Scores', icon: Trophy },
          { id: 'faq', label: 'FAQ', icon: HelpCircle },
          { id: 'help_support', label: 'Help & Support', icon: Headphones },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText },
          { id: 'privacy', label: 'Privacy Policy', icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`profile-menu-item-${item.id}`}
              onClick={() => setSubView(item.id as ProfileSubView)}
              className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#DFF7EA]/50 text-[#087F8C] flex items-center justify-center group-hover:bg-[#087F8C] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-xs sm:text-sm font-black text-[#183345] group-hover:text-[#087F8C] transition-colors">
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-[#607582] group-hover:text-[#087F8C] transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Sound & Preference Settings */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#DCE7E8] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-[#087F8C]" />
          ) : (
            <VolumeX className="w-4 h-4 text-[#607582]" />
          )}
          <span className="text-xs font-bold text-[#183345]">Game Sound Effects</span>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
            soundEnabled ? 'bg-[#82C341]' : 'bg-slate-300'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
              soundEnabled ? 'left-6' : 'left-1'
            }`}
          />
        </button>
      </div>

      {/* GoPlay Info */}
      <div className="text-center pt-2 text-[10px] text-slate-400 font-bold space-y-0.5">
        <div>GoPlay v2.0 • Gaming Edition</div>
        <div>Official Gaming Portal</div>
      </div>

    </div>
  );
};
