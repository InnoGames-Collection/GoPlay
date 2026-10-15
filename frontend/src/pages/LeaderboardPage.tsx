/**
 * GoPlay - Official Crazy Color Tournament Leaderboard
 * 
 * Strict Architecture per Part 5:
 * - Tournament Leaderboard EXCLUSIVELY for the active tournament: Crazy Color
 * - Top 10 eligible Crazy Color tournament scorers
 * - Current player's Crazy Color score & rank (even when outside top 10)
 * - Privacy-preserving masked MSISDN format (e.g. 091*****890)
 * - Zero mixed scores from other games (Helix, Candy Juicy, Emoji Fun, etc.)
 * - Redundant "Overall Best" tab and summary completely removed
 */

import React, { useMemo, useEffect, useState } from 'react';
import { UserProfile, GameDefinition } from '../types';
import { TournamentService, OverallTournamentEntry } from '../services/tournamentService';
import { GameCatalog } from '../services/gameCatalog';
import { catalogGameToDefinition } from '../games/registry';
import { 
  Trophy, 
  Play, 
  Crown, 
  Medal,
  Sparkles
} from 'lucide-react';

interface LeaderboardPageProps {
  profile: UserProfile;
  games?: GameDefinition[];
  onPlayGame?: (game: GameDefinition) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({
  profile,
  onPlayGame,
}) => {
  const [liveEntries, setLiveEntries] = useState<any[]>([]);
  const crazyGame = useMemo(() => {
    return GameCatalog.getById('crazy-colors');
  }, []);

  useEffect(() => {
    TournamentService.refreshLiveLeaderboard('tourn_crazy_colors_01').then((res) => {
      setLiveEntries(res || []);
    });
  }, []);

  // Real tournament summary specifically for Crazy Color
  const summary = useMemo(() => {
    return TournamentService.getTournamentSummary(profile, liveEntries);
  }, [profile, liveEntries]);

  // Current user Crazy Color tournament score
  const userScore = useMemo(() => {
    const fromSummary = summary.currentUserScores?.['crazy-colors'] ?? 0;
    const fromProfile = profile?.highScores?.['crazy-colors'] ?? 0;
    return Math.max(fromSummary, fromProfile);
  }, [summary, profile]);

  const maskedUserMsisdn = profile.phoneNumber 
    ? `${profile.phoneNumber.slice(0, 3)}*****${profile.phoneNumber.slice(-3)}` 
    : '091*****890';

  const top10 = summary.topEntries.slice(0, 10);
  const userRank = summary.currentUserRank > 0 ? summary.currentUserRank : (userScore > 0 ? 11 : 0);
  const isUserInTop10 = top10.some((e) => e.isCurrentUser);

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 sm:px-4 pt-3 space-y-4">
        
        {/* =========================================================================
            1. TOURNAMENT HEADER CARD (Crazy Color Championship)
           ========================================================================= */}
        <div className="relative rounded-3xl bg-[#102B3F] text-white p-4.5 shadow-sm overflow-hidden border border-[#116B73]/50">
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#82C341] text-white text-[9px] font-black uppercase tracking-wider">
                <Trophy className="w-3 h-3 text-[#E9B949]" />
                <span>ACTIVE TOURNAMENT</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
                Crazy Color Leaderboard
              </h1>
              <p className="text-xs text-[#DFF7EA] font-medium">
                Crazy Color Championship • Top 10 Eligible Scorers
              </p>
            </div>

            {crazyGame && onPlayGame && (
              <button
                type="button"
                onClick={() => onPlayGame(catalogGameToDefinition(crazyGame))}
                className="py-2.5 px-4 rounded-2xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            2. CURRENT USER STANDING CARD (Crazy Color Only)
           ========================================================================= */}
        <div className="p-4 rounded-2xl bg-[#DFF7EA]/60 border border-[#82C341]/40 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#82C341] text-white flex items-center justify-center font-black text-sm shadow-xs">
              {userScore > 0 && userRank > 0 ? `#${userRank}` : '—'}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-[#116B73]">
                Your Standing in Crazy Color
              </div>
              <div className="text-sm font-black text-[#183345] font-mono tracking-wider">
                {maskedUserMsisdn}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-bold text-[#607582] uppercase">
              Tournament Score
            </div>
            <div className="text-base sm:text-lg font-black text-[#087F8C] font-mono">
              {userScore > 0 ? `${userScore.toLocaleString()} pts` : '0 pts'}
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. TOP 10 PLAYERS TABLE (Exclusively Crazy Color)
           ========================================================================= */}
        <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-xs">
          <div className="px-4 py-3 bg-[#F4F7F6] border-b border-[#DCE7E8] flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#183345] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E9B949]" />
              <span>Top 10 Competitors • Crazy Color</span>
            </h3>
            <span className="text-[10px] font-bold text-[#607582]">
              {summary.timeRemaining.formatted}
            </span>
          </div>

          {/* Table Column Headers */}
          <div className="grid grid-cols-12 gap-1 px-3.5 py-2.5 bg-[#F4F7F6]/80 border-b border-[#DCE7E8] text-[10px] font-black uppercase tracking-wider text-[#607582]">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-3 text-right">Score</div>
            <div className="col-span-3 text-right">Prize</div>
          </div>

          <div className="divide-y divide-[#DCE7E8]">
            {top10.map((entry) => {
              const isFirst = entry.rank === 1;
              const isSecond = entry.rank === 2;
              const isThird = entry.rank === 3;
              const isUser = entry.isCurrentUser;

              return (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-12 gap-1 px-3.5 py-3 items-center transition-colors ${
                    isUser
                      ? 'bg-[#DFF7EA]/50 font-black border-l-4 border-l-[#82C341]'
                      : isFirst
                      ? 'bg-amber-50/40'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  {/* Rank */}
                  <div className="col-span-2 text-center flex items-center justify-center">
                    {isFirst && <Crown className="w-5 h-5 text-[#E9B949] fill-[#E9B949]" />}
                    {isSecond && <Medal className="w-5 h-5 text-slate-400 fill-slate-300" />}
                    {isThird && <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />}
                    {!isFirst && !isSecond && !isThird && (
                      <span className="text-xs font-black text-[#607582]">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Player: Masked MSISDN */}
                  <div className="col-span-4 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-mono font-bold truncate ${isUser ? 'text-[#087F8C] font-black' : 'text-[#183345]'}`}>
                        {entry.playerMasked}
                      </span>
                      {isUser && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[#82C341] text-white text-[8px] font-black shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="col-span-3 text-right font-mono">
                    <div className="text-xs font-black text-[#183345]">
                      {entry.bestScore.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-[#607582] font-medium font-sans">pts</div>
                  </div>

                  {/* Prize */}
                  <div className="col-span-3 text-right truncate">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-[#DFF7EA] text-[#116B73] text-[10px] font-black truncate max-w-full">
                      {entry.rewardText || 'Cash Prize'}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Current Player Row Pinned if Outside Top 10 */}
            {!isUserInTop10 && userScore > 0 && userRank > 10 && (
              <div className="grid grid-cols-12 gap-1 px-3.5 py-3 items-center bg-[#DFF7EA]/60 font-black border-t-2 border-[#82C341]">
                <div className="col-span-2 text-center flex items-center justify-center">
                  <span className="text-xs font-black text-[#087F8C]">#{userRank}</span>
                </div>
                <div className="col-span-4 min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black text-[#087F8C] truncate">
                      {maskedUserMsisdn}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-[#82C341] text-white text-[8px] font-black shrink-0">
                      YOU
                    </span>
                  </div>
                </div>
                <div className="col-span-3 text-right font-mono">
                  <div className="text-xs font-black text-[#183345]">
                    {userScore.toLocaleString()}
                  </div>
                  <div className="text-[9px] text-[#607582] font-medium font-sans">pts</div>
                </div>
                <div className="col-span-3 text-right truncate">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-white text-[#607582] text-[10px] font-bold truncate max-w-full border border-[#DCE7E8]">
                    Competitor
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

