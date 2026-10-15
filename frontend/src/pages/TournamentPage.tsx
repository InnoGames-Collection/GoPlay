/**
 * GameON Tele - Official Weekly Tournament Page
 * 
 * Strict Tournament Architecture:
 * - Weekly cycle with real-time countdown timer
 * - 4 Featured Tournament Games (Crazy Color, Fruit Ninja, Helix Jump, Pop Piano)
 * - Admin-configurable game selection engine
 * - Individual game score retention
 * - Overall Tournament Best Score = MAX(score across active tournament games)
 * - Deterministic tie handling (Best Score -> Timestamp)
 * - Top 10 overall tournament rankings with Masked MSISDNs, Ethiopian names, Best Score, and originating game
 * - Separation between Game Scores, Tournament Rankings, and Prize distribution
 * - Conforms to official telebirr / GameON Tele design language (#1688C9, #8BCB3D)
 */

import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, GameDefinition } from '../types';
import { TournamentService, OverallTournamentEntry } from '../services/tournamentService';
import { apiService } from '../services/apiService';
import { catalogGameToDefinition } from '../games/registry';
import { 
  Swords, 
  Clock, 
  Play, 
  Star,
  ShieldCheck
} from 'lucide-react';

interface TournamentPageProps {
  profile: UserProfile;
  onPlayGame: (game: GameDefinition) => void;
}

export const TournamentPage: React.FC<TournamentPageProps> = ({
  profile,
  onPlayGame,
}) => {
  // 1. Live Countdown ticker & database entries
  const [ticker, setTicker] = useState(0);
  const [liveEntries, setLiveEntries] = useState<any[]>([]);
  const [dailyStatus, setDailyStatus] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    TournamentService.refreshLiveLeaderboard('tourn_crazy_colors_01').then((entries) => {
      if (entries) setLiveEntries(entries);
    });
    apiService.getDailyStatus().then((res) => {
      if (res) setDailyStatus(res);
    });
  }, []);

  // 2. Fetch Tournament Summary
  const summary = useMemo(() => {
    return TournamentService.getTournamentSummary(profile, liveEntries);
  }, [profile, ticker, liveEntries]);

  const {
    config,
    participatingGames,
    topEntries,
    currentUserBestScore,
    currentUserBestGame,
    currentUserRank,
    currentUserScores,
    totalParticipants,
    timeRemaining,
  } = summary;

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 sm:px-4 pt-3 space-y-4">
        
        {/* =========================================================================
            1. TOURNAMENT HERO BANNER & TIMER
           ========================================================================= */}
        <div className="relative rounded-2xl bg-[#102B3F] text-white p-4 sm:p-5 shadow-sm overflow-hidden border border-[#116B73]/40">
          {/* Subtle background decoration */}
          <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-36 h-36 bg-[#087F8C]/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 w-44 h-24 bg-[#82C341]/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            {/* Badges row */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#82C341] text-white text-[10px] font-black uppercase tracking-wider shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>WEEKLY TOURNAMENT • LIVE</span>
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-extrabold uppercase backdrop-blur-xs">
                  {config.frequency}
                </span>
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[#E9B949] text-[10px] font-black">
                <Clock className="w-3 h-3 text-[#E9B949]" />
                <span>{timeRemaining.formatted}</span>
              </div>
            </div>

            {/* Title & Description */}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                {config.title}
              </h1>
              <p className="text-xs text-[#DFF7EA] font-medium mt-1 leading-relaxed">
                Compete across this week's 4 featured games. Your tournament ranking is calculated from your <strong className="text-white font-extrabold">single highest score</strong> (Best Score).
              </p>
            </div>

            {/* Quick Stats Pill Bar */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                <div className="text-[9px] uppercase font-bold text-[#DFF7EA]">Total Prize Pool</div>
                <div className="text-xs sm:text-sm font-black text-[#E9B949]">10,000+ ETB</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                <div className="text-[9px] uppercase font-bold text-[#DFF7EA]">Active Games</div>
                <div className="text-xs sm:text-sm font-black text-white">{participatingGames.length} Games</div>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-2 border border-white/10">
                <div className="text-[9px] uppercase font-bold text-[#DFF7EA]">Players Joined</div>
                <div className="text-xs sm:text-sm font-black text-white">{totalParticipants.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            DAILY CHALLENGE STATUS CARD (Strictly once per day enforcement)
           ========================================================================= */}
        {dailyStatus?.hasActiveDaily && (
          <div className={`rounded-2xl border p-4 shadow-xs space-y-2 ${
            dailyStatus.hasAttemptedToday
              ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900'
              : 'border-amber-200 bg-amber-50/80 text-amber-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider">
                    {dailyStatus.activeTournament?.title || 'Daily Challenge'}
                  </div>
                  <div className="text-[11px] font-medium text-[#607582]">
                    {dailyStatus.hasAttemptedToday
                      ? `Completed today: Score of ${dailyStatus.attempt?.score ?? 0} pts recorded.`
                      : `Strictly 1 attempt per day. Prize Pool: ${dailyStatus.activeTournament?.prize_pool_etb || 5000} ETB`}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                dailyStatus.hasAttemptedToday
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-600 text-white animate-pulse'
              }`}>
                {dailyStatus.hasAttemptedToday ? '✓ Attempt Used' : 'Ready to Play'}
              </span>
            </div>
            {dailyStatus.hasAttemptedToday && (
              <p className="text-[10px] text-emerald-700 font-semibold italic">
                Only one daily challenge attempt permitted per 24-hour cycle. Resets at midnight.
              </p>
            )}
          </div>
        )}

        {/* =========================================================================
            2. PLAYER'S TOURNAMENT STANDING CARD
           ========================================================================= */}
        <div className="rounded-2xl border border-[#82C341]/30 bg-[#DFF7EA]/50 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-[#82C341] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                {currentUserBestScore > 0 ? `#${currentUserRank}` : '—'}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-[#607582] flex items-center gap-1">
                  <span>Your</span>
                  {currentUserBestScore > 0 && currentUserRank <= 10 && (
                    <span className="px-1.5 py-0.2 rounded bg-[#E9B949] text-[#183345] text-[8px] font-black">
                      TOP 10
                    </span>
                  )}
                </div>
                <div className="text-sm font-black text-[#183345] tracking-wider font-mono">
                  {profile.phoneNumber ? `${profile.phoneNumber.slice(0, 3)}*****${profile.phoneNumber.slice(-3)}` : '091*****890'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-bold text-[#607582] uppercase">
                Best Score
              </div>
              <div className="text-lg font-black text-[#087F8C] leading-none mt-0.5">
                {currentUserBestScore.toLocaleString()} <span className="text-xs font-semibold text-[#607582]">pts</span>
              </div>
              {currentUserBestGame && (
                <div className="text-[10px] font-extrabold text-[#82C341] mt-0.5">
                  via {currentUserBestGame.gameName}
                </div>
              )}
            </div>
          </div>

          {/* 4 Tournament Games Score Chips */}
          <div className="pt-2 border-t border-[#82C341]/20">
            <div className="text-[10px] font-bold text-[#607582] uppercase mb-1.5">
              Your Scores
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {participatingGames.map((game) => {
                const score = currentUserScores[game.gameId] || 0;
                const isBest = currentUserBestScore > 0 && score === currentUserBestScore;

                return (
                  <div
                    key={game.gameId}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isBest
                        ? 'bg-[#E9B949]/20 border-[#E9B949] shadow-xs'
                        : 'bg-white border-[#DCE7E8]'
                    }`}
                  >
                    <div className="text-[10px] font-extrabold text-[#183345] truncate">
                      {game.gameName}
                    </div>
                    <div className="text-xs font-black text-[#183345] mt-0.5">
                      {score.toLocaleString()} <span className="text-[9px] font-medium text-[#607582]">pts</span>
                    </div>
                    {isBest ? (
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-[#E9B949] text-[#183345] text-[8px] font-black uppercase tracking-wider">
                        ★ BEST
                      </span>
                    ) : (
                      <span className="inline-block mt-0.5 text-[8px] font-bold text-[#607582] uppercase">
                        {score > 0 ? 'Recorded' : 'Not Played'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. FOUR PARTICIPATING TOURNAMENT GAMES
           ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-[#183345] flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-[#087F8C]" />
                <span>Active Tournament Games (4)</span>
              </h2>
              <p className="text-[11px] text-[#607582] font-medium">
                Play any or all 4 games to set your highest single score
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {participatingGames.map((game) => {
              const gameDef = catalogGameToDefinition(game);
              const userScore = currentUserScores[game.gameId] || 0;
              const isBest = currentUserBestScore > 0 && userScore === currentUserBestScore;

              return (
                <div
                  key={game.gameId}
                  id={`tournament-game-${game.gameId}`}
                  className="rounded-2xl border border-[#DCE7E8] bg-white overflow-hidden shadow-xs hover:border-[#087F8C]/50 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-28 w-full bg-[#F4F7F6] overflow-hidden">
                    <img
                      src={game.banner}
                      alt={game.gameName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Game Category Badge */}
                    <div className="absolute top-2 left-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/90 text-[#183345] text-[9px] font-black uppercase tracking-wider shadow-xs">
                        {game.category}
                      </span>
                    </div>

                    {/* Best Game indicator if applicable */}
                    {isBest && (
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#E9B949] text-[#183345] text-[9px] font-black uppercase tracking-wider shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>YOUR BEST</span>
                        </span>
                      </div>
                    )}

                    {/* Game Title over image */}
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <h3 className="text-base font-black text-white leading-tight drop-shadow-sm truncate">
                        {game.gameName}
                      </h3>
                      <p className="text-[10px] text-slate-200 truncate">
                        {game.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#607582]">
                        Your Game Score
                      </div>
                      <div className="text-sm font-black text-[#183345]">
                        {userScore.toLocaleString()} <span className="text-[10px] font-normal text-[#607582]">pts</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPlayGame(gameDef)}
                      className="py-2 px-3.5 rounded-xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-xs transition-transform active:scale-95 shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Now</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
