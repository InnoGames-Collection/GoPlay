/**
 * GoPlay - Clean & Attractive Commercial Gaming Platform Landing Page
 * 
 * Strict Redesign Structure:
 * 1. Compact GoPlay header (rendered in App wrapper)
 * 2. Visually dominant promotional gaming banner ("Your Next Game Starts Here")
 * 3. Compact player summary: Available Coins & Crazy Color Tournament Best Score
 * 4. Short informational section: Active Crazy Color tournament details & countdown
 * 5. Clear action leading users to the Games tab
 * 
 * Brand Identity & Palette:
 * - GoPlay green: #82C341
 * - Deep navy: #102B3F
 * - Teal: #087F8C
 * - Soft mint: #DFF7EA
 * - Warm neutral: #F4F7F6
 * - Dark text: #183345
 * - Secondary text: #607582
 * - Subtle border: #DCE7E8
 * - Restrained gold: #E9B949
 */

import React, { useState, useEffect, useMemo } from 'react';
import { GameDefinition, UserProfile } from '../types';
import { TournamentService } from '../services/tournamentService';
import { GameCatalog } from '../services/gameCatalog';
import { catalogGameToDefinition } from '../games/registry';
import { 
  Sparkles, 
  Gamepad2, 
  Trophy, 
  Plus, 
  Swords, 
  Clock, 
  Play, 
  ChevronRight 
} from 'lucide-react';

interface HomePageProps {
  games?: GameDefinition[];
  profile: UserProfile;
  onLaunchGame: (game: GameDefinition) => void;
  onOpenDetails?: (game: GameDefinition) => void;
  onOpenBuyCoins?: () => void;
  onNavigateToGames?: (category?: string) => void;
  activeEntitlements?: Record<string, boolean>;
}

export const HomePage: React.FC<HomePageProps> = ({
  games = [],
  profile,
  onLaunchGame,
  onOpenBuyCoins,
  onNavigateToGames,
}) => {
  // 1. Live countdown ticker (updates every second)
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Authoritative live leaderboard entries from backend
  const [liveEntries, setLiveEntries] = useState<any[]>([]);
  useEffect(() => {
    TournamentService.refreshLiveLeaderboard('tourn_crazy_colors_01').then((entries) => {
      if (entries) setLiveEntries(entries);
    });
  }, []);

  // 3. Authoritative tournament summary & live countdown
  const tournamentSummary = useMemo(() => {
    return TournamentService.getTournamentSummary(profile, liveEntries);
  }, [profile, liveEntries, ticker]);

  const tournamentConfig = tournamentSummary.config;

  // 4. Real Crazy Color tournament best score
  const crazyColorBestScore = useMemo(() => {
    const tournamentScore = tournamentSummary?.currentUserScores?.['crazy-colors'] ?? 0;
    const personalCrazyScore = profile?.highScores?.['crazy-colors'] ?? 0;
    return Math.max(tournamentScore, personalCrazyScore);
  }, [tournamentSummary, profile]);

  // 5. Authenticated player's actual available coins balance
  const coinsCount = profile?.coins ?? 0;

  // Active tournament game definition
  const crazyColorsGame = useMemo(() => {
    const found = games.find((g) => g.id === 'crazy-colors');
    if (found) return found;
    const cat = GameCatalog.getById('crazy-colors');
    return cat ? catalogGameToDefinition(cat) : null;
  }, [games]);

  // Top prize text from authoritative tournament config
  const topPrize = tournamentConfig.prizes?.[0];
  const topPrizeText = topPrize?.rewardText || (topPrize?.etbAmount ? `${topPrize.etbAmount.toLocaleString()} ETB Cash` : '');

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 sm:px-4 space-y-4 pt-3">
        
        {/* =========================================================================
            1. PROMOTIONAL GAMING BANNER
            - Responsive horizontal composition (~2.2:1 to ~2.4:1 aspect ratio)
            - 20px rounded corners, deep navy background
            - High-resolution gaming artwork on the right with smooth text fade
            - Concise headline, supporting text, and "Explore Games" action
           ========================================================================= */}
        <div 
          id="home-promotional-banner"
          className="relative w-full aspect-[2.25/1] sm:aspect-[2.35/1] min-h-[155px] max-h-[250px] rounded-[20px] bg-[#102B3F] text-white overflow-hidden shadow-sm border border-[#DCE7E8]/30 select-none"
        >
          {/* Right focal gaming artwork */}
          <div className="absolute right-0 top-0 bottom-0 w-[55%] sm:w-[50%] overflow-hidden pointer-events-none">
            <img
              src="/banners/candy%20crush.png"
              alt="GoPlay Featured Games"
              className="w-full h-full object-cover object-center select-none"
              loading="eager"
            />
            {/* Subtle horizontal gradient to guarantee text readability on the left */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#102B3F] via-[#102B3F]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102B3F]/80 via-transparent to-transparent" />
          </div>

          {/* Subtle ambient decorative glow */}
          <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-[#087F8C]/20 rounded-full blur-xl pointer-events-none" />

          {/* Left content column */}
          <div className="relative z-10 h-full flex flex-col justify-between p-3.5 sm:p-5 max-w-[62%] sm:max-w-[58%]">
            {/* Micro badge */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#82C341]/20 border border-[#82C341]/40 text-[#82C341] text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider">
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Featured</span>
              </span>
            </div>

            {/* Headline and supporting text */}
            <div className="my-auto py-0.5">
              <h2 className="text-sm sm:text-lg md:text-xl font-black text-white leading-tight tracking-tight drop-shadow-sm">
                Your Next Game Starts Here
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-200 mt-0.5 sm:mt-1 font-medium leading-snug line-clamp-2">
                Play your favorites and beat your best.
              </p>
            </div>

            {/* Call to action */}
            <div>
              <button
                id="home-banner-cta-btn"
                type="button"
                onClick={() => onNavigateToGames?.('All Games')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-[11px] sm:text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Explore Games</span>
              </button>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2. PLAYER SUMMARY: AVAILABLE COINS & CRAZY COLOR BEST SCORE
            - Side-by-side compact cards
            - Real authenticated player coins
            - Real Crazy Color tournament best score or elegant empty state
           ========================================================================= */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3" id="home-player-summary">
          {/* Available Coins Card */}
          <div
            id="home-summary-coins-card"
            onClick={onOpenBuyCoins}
            className="bg-white rounded-[20px] p-3 sm:p-4 border border-[#DCE7E8] shadow-xs flex flex-col justify-between hover:border-[#82C341]/60 transition-all active:scale-[0.99] cursor-pointer group"
            title="Click to view or top up coins"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#607582] truncate">
                Available Coins
              </span>
              <div className="w-5 h-5 rounded-full bg-[#DFF7EA] text-[#82C341] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Plus className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-[#183345] tracking-tight">
                {coinsCount.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-[#607582]">Coins</span>
            </div>
          </div>

          {/* Crazy Color Best Score Card */}
          <div
            id="home-summary-score-card"
            className="bg-white rounded-[20px] p-3 sm:p-4 border border-[#DCE7E8] shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-[#607582] truncate">
                Best Score
              </span>
              <div className="w-5 h-5 rounded-full bg-[#F4F7F6] text-[#E9B949] flex items-center justify-center shrink-0">
                <Trophy className="w-3.5 h-3.5 fill-[#E9B949]" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5">
              {crazyColorBestScore > 0 ? (
                <>
                  <span className="text-xl sm:text-2xl font-black text-[#183345] tracking-tight">
                    {crazyColorBestScore.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-bold text-[#607582] truncate">Crazy Color</span>
                </>
              ) : (
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-extrabold text-[#607582]">
                    No score yet
                  </span>
                  <span className="text-[9px] text-[#607582]/80 font-medium truncate">
                    Crazy Color Tournament
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. SHORT INFORMATIONAL SECTION: ACTIVE CRAZY COLOR TOURNAMENT
            - Real tournament status & countdown from authoritative config
            - Real top prize description
            - Direct action to play the active tournament game
           ========================================================================= */}
        <div 
          id="home-tournament-info-section"
          className="bg-white rounded-[20px] p-4 sm:p-5 border border-[#DCE7E8] shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#DFF7EA] text-[#087F8C] flex items-center justify-center shrink-0">
                <Swords className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#183345] leading-tight">
                  Ready for your next challenge?
                </h3>
                <p className="text-[11px] font-bold text-[#607582]">
                  {tournamentConfig.title}
                </p>
              </div>
            </div>

            {/* Live status badge with real countdown */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#102B3F] text-white text-[10px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#82C341] animate-pulse" />
              <Clock className="w-3 h-3 text-[#82C341]" />
              <span>{tournamentSummary.timeRemaining.formatted}</span>
            </div>
          </div>

          {/* Real tournament details */}
          <div className="rounded-xl bg-[#F4F7F6] p-3 border border-[#DCE7E8]/70 text-xs text-[#183345] space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="font-bold text-[#607582]">Active Tournament Game</span>
              <span className="font-black text-[#087F8C]">Crazy Color</span>
            </div>
            {topPrizeText && (
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#607582]">Top Prize</span>
                <span className="font-black text-[#183345]">{topPrizeText}</span>
              </div>
            )}
            <p className="text-[11px] text-[#607582] pt-1 border-t border-[#DCE7E8]/50">
              Play Crazy Color to set your high score and climb the weekly leaderboard.
            </p>
          </div>

          {/* Action button: Play Crazy Color */}
          {crazyColorsGame && (
            <button
              id="home-play-tournament-btn"
              type="button"
              onClick={() => onLaunchGame(crazyColorsGame)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#102B3F] hover:bg-[#183345] text-white font-black text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Play className="w-4 h-4 fill-[#82C341] text-[#82C341]" />
              <span>Play Crazy Color Tournament</span>
            </button>
          )}
        </div>

        {/* =========================================================================
            4. CLEAR ACTION LEADING USERS TO GAMES TAB
            - Prominent dedicated action surface
            - Smooth transition to existing Games tab
           ========================================================================= */}
        <div>
          <button
            id="home-browse-games-cta"
            type="button"
            onClick={() => onNavigateToGames?.('All Games')}
            className="w-full bg-white hover:bg-[#DFF7EA]/30 border border-[#DCE7E8] hover:border-[#82C341]/60 rounded-[20px] p-3.5 sm:p-4 transition-all shadow-xs flex items-center justify-between group cursor-pointer active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#82C341] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <Gamepad2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="text-left">
                <div className="text-sm font-black text-[#183345] group-hover:text-[#087F8C] transition-colors flex items-center gap-1.5">
                  <span>Explore All Games</span>
                </div>
                <p className="text-[11px] font-semibold text-[#607582] mt-0.5">
                  Browse our complete catalog of instant-play games
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#F4F7F6] group-hover:bg-[#82C341] text-[#183345] group-hover:text-white flex items-center justify-center shrink-0 transition-all">
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </button>
        </div>

        {/* Platform footer note */}
        <div className="pt-2 text-center text-[11px] text-[#607582]/80 font-bold">
          GoPlay Gaming Platform • Instant Play
        </div>

      </div>
    </div>
  );
};
