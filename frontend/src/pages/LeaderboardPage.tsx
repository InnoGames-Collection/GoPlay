/**
 * GameON Tele - Official Game-Specific Leaderboard & Rankings Page
 * 
 * Strict Architecture:
 * - Leaderboard PER GAME where leaderboardEnabled === true
 * - Zero generic mixing of scores across disparate games
 * - Game selector pills: [ Candy Blast ] [ World Legends ] [ Helix Jump ] ...
 * - Player rank & score in the selected game
 * - Top 10 players with masked MSISDN (e.g. 091*****123) for telebirr customer privacy
 * - Rewards in GameON coins
 */

import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, GameDefinition } from '../types';
import { GameLeaderboardService } from '../services/gameLeaderboardService';
import { TournamentService } from '../services/tournamentService';
import { catalogGameToDefinition } from '../games/registry';
import { 
  Trophy, 
  Play, 
  Crown, 
  Medal,
  Swords
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
  // 1. Tournament and game leaderboard sections
  const tournamentGames = useMemo(() => {
    return TournamentService.getActiveTournamentGames();
  }, []);

  const [selectedTab, setSelectedTab] = useState<string>('overall-best');
  const [liveEntries, setLiveEntries] = useState<any[]>([]);

  // Individual game leaderboard data if a game is selected
  const isOverall = selectedTab === 'overall-best';
  const activeGame = useMemo(() => {
    return tournamentGames.find((g) => g.gameId === selectedTab) || tournamentGames[0];
  }, [tournamentGames, selectedTab]);

  useEffect(() => {
    if (!isOverall && activeGame?.gameId) {
      GameLeaderboardService.refreshLiveGameLeaderboard(activeGame.gameId).then((res) => {
        setLiveEntries(res || []);
      });
    }
  }, [isOverall, activeGame?.gameId]);

  const individualLeaderboardData = useMemo(() => {
    if (isOverall) return null;
    return GameLeaderboardService.getLeaderboardForGame(activeGame.gameId, profile);
  }, [isOverall, activeGame.gameId, profile, liveEntries]);

  // Overall Best leaderboard data
  const overallSummary = useMemo(() => {
    return TournamentService.getTournamentSummary(profile);
  }, [profile]);

  const maskedUserMsisdn = profile.phoneNumber 
    ? `${profile.phoneNumber.slice(0, 3)}*****${profile.phoneNumber.slice(-3)}` 
    : '091*****890';

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 sm:px-4 pt-3 space-y-4">
        
        {/* =========================================================================
            1. FIVE LEADERBOARD SELECTION PILLS
               1. Crazy Color  2. Fruit Ninja  3. Helix Jump  4. Pop Piano  5. Overall Best
           ========================================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-[#607582] flex items-center gap-1">
              <Swords className="w-3.5 h-3.5 text-[#087F8C]" />
              <span>Tournament Leaderboards</span>
            </div>
            <span className="text-[10px] font-bold text-[#607582]">
              5 Leaderboard Sections
            </span>
          </div>

          <div 
            className="flex gap-2 overflow-x-auto scrollbar-none pb-1 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* First 4: Individual Tournament Games */}
            {tournamentGames.map((g) => {
              const isSelected = selectedTab === g.gameId;
              return (
                <button
                  key={g.gameId}
                  onClick={() => setSelectedTab(g.gameId)}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shrink-0 snap-start transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#82C341] text-white shadow-xs font-black'
                      : 'bg-white hover:bg-[#DFF7EA]/50 text-[#183345] border border-[#DCE7E8]'
                  }`}
                >
                  {g.gameName}
                </button>
              );
            })}

            {/* Fifth: Overall Best */}
            <button
              onClick={() => setSelectedTab('overall-best')}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs shrink-0 snap-start transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                selectedTab === 'overall-best'
                  ? 'bg-[#102B3F] text-[#E9B949] shadow-xs font-black ring-2 ring-[#E9B949]/40'
                  : 'bg-white hover:bg-[#F4F7F6] text-[#183345] font-black border border-[#DCE7E8]'
              }`}
            >
              <span>★ Overall Best</span>
            </button>
          </div>
        </div>

        {/* =========================================================================
            2. LEADERBOARD CONTENT VIEW
           ========================================================================= */}
        {isOverall ? (
          /* =========================================================================
              VIEW A: OVERALL BEST LEADERBOARD (Top 10 ranked by highest single score)
             ========================================================================= */
          <div className="space-y-4">
            {/* Header Card */}
            <div className="rounded-2xl bg-[#102B3F] text-white p-4 shadow-sm border border-[#116B73]/40">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/20 text-[#E9B949] text-[9px] font-black uppercase tracking-wider">
                  <Trophy className="w-3 h-3 text-[#E9B949]" />
                  <span>WEEKLY TOURNAMENT SUMMARY</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Overall Best Leaderboard
                </h2>
                <p className="text-[11px] text-[#DFF7EA]">
                  Ranked by each player's highest single score across Crazy Color, Fruit Ninja, Helix Jump, or Pop Piano.
                </p>
              </div>
            </div>

            {/* Current User Standing Card */}
            <div className="p-3.5 rounded-2xl bg-[#DFF7EA]/50 border border-[#82C341]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#82C341] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  {overallSummary.currentUserBestScore > 0 ? `#${overallSummary.currentUserRank}` : '—'}
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-[#116B73]">
                    Your Overall Best
                  </div>
                  <div className="text-sm font-black text-[#183345] font-mono tracking-wider">
                    {maskedUserMsisdn}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-bold text-[#607582] uppercase">
                  Best Score
                </div>
                <div className="text-base font-black text-[#087F8C]">
                  {overallSummary.currentUserBestScore.toLocaleString()} pts
                </div>
                {overallSummary.currentUserBestGame && (
                  <div className="text-[10px] font-extrabold text-[#82C341]">
                    via {overallSummary.currentUserBestGame.gameName}
                  </div>
                )}
              </div>
            </div>

            {/* Overall Best Top 10 Table: Rank | Player | Best Score | Game */}
            <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-xs">
              <div className="px-4 py-3 bg-[#F4F7F6] border-b border-[#DCE7E8] flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-[#183345]">
                  Overall Best • Top 10
                </h3>
                <span className="text-[10px] font-bold text-[#607582]">
                  {overallSummary.totalParticipants.toLocaleString()} Players
                </span>
              </div>

              {/* Table Column Headers */}
              <div className="grid grid-cols-12 gap-1 px-3.5 py-2 bg-[#F4F7F6]/80 border-b border-[#DCE7E8] text-[10px] font-black uppercase tracking-wider text-[#607582]">
                <div className="col-span-2 text-center">Rank</div>
                <div className="col-span-4">Player</div>
                <div className="col-span-3 text-right">Best Score</div>
                <div className="col-span-3 text-right">Game</div>
              </div>

              <div className="divide-y divide-[#DCE7E8]">
                {overallSummary.topEntries.slice(0, 10).map((entry) => {
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

                      {/* Player: Masked MSISDN ONLY */}
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

                      {/* Best Score */}
                      <div className="col-span-3 text-right">
                        <div className="text-xs font-black text-[#183345]">
                          {entry.bestScore.toLocaleString()}
                        </div>
                        <div className="text-[9px] text-[#607582] font-medium">pts</div>
                      </div>

                      {/* Game */}
                      <div className="col-span-3 text-right truncate">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-[#F4F7F6] text-[#183345] text-[10px] font-extrabold truncate max-w-full">
                          {entry.bestGameTitle}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              VIEW B: INDIVIDUAL GAME LEADERBOARD (Crazy Color, Fruit Ninja, Helix Jump, Pop Piano)
             ========================================================================= */
          individualLeaderboardData && (
            <div className="space-y-4">
              {/* Selected Game Header & Current User Rank Card */}
              <div className="relative rounded-2xl bg-[#102B3F] text-white p-4 shadow-sm overflow-hidden border border-[#116B73]/40">
                <div className="relative z-10 flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#82C341] text-white text-[9px] font-black uppercase tracking-wider">
                      <Trophy className="w-3 h-3 text-[#E9B949]" />
                      <span>TOURNAMENT GAME RANKINGS</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white leading-tight truncate">
                      {individualLeaderboardData.game.gameName} Leaderboard
                    </h2>
                    <p className="text-[11px] text-[#DFF7EA]">
                      Top 10 single scores recorded in {individualLeaderboardData.game.gameName}.
                    </p>
                  </div>

                  {onPlayGame && (
                    <button
                      onClick={() => onPlayGame(catalogGameToDefinition(individualLeaderboardData.game))}
                      className="py-2 px-3.5 rounded-xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-xs transition-transform active:scale-95 shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>
                  )}
                </div>
              </div>

              {/* User's Standing Card */}
              <div className="p-3.5 rounded-2xl bg-[#DFF7EA]/50 border border-[#82C341]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#82C341] text-white flex items-center justify-center font-black text-sm shadow-xs">
                    #{individualLeaderboardData.userRank}
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-[#607582]">
                      Your Standing in {individualLeaderboardData.game.gameName}
                    </div>
                    <div className="text-sm font-black text-[#183345] font-mono tracking-wider">
                      {maskedUserMsisdn}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-bold text-[#607582] uppercase">
                    High Score
                  </div>
                  <div className="text-base font-black text-[#087F8C]">
                    {individualLeaderboardData.userScore.toLocaleString()} pts
                  </div>
                </div>
              </div>

              {/* Top 10 Players Table */}
              <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-xs">
                <div className="px-4 py-3 bg-[#F4F7F6] border-b border-[#DCE7E8] flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#183345]">
                    Top 10 Players • {individualLeaderboardData.game.gameName}
                  </h3>
                  <span className="text-[10px] font-bold text-[#607582]">
                    {individualLeaderboardData.totalParticipants.toLocaleString()} Competitors
                  </span>
                </div>

                <div className="divide-y divide-[#DCE7E8]">
                  {individualLeaderboardData.entries.slice(0, 10).map((entry) => {
                    const isFirst = entry.rank === 1;
                    const isSecond = entry.rank === 2;
                    const isThird = entry.rank === 3;
                    const isUser = entry.isCurrentUser;

                    return (
                      <div
                        key={entry.rank}
                        className={`flex items-center justify-between p-3 transition-colors ${
                          isUser
                            ? 'bg-[#DFF7EA]/50 font-black border-l-4 border-l-[#82C341]'
                            : isFirst
                            ? 'bg-amber-50/40'
                            : 'hover:bg-slate-50/60'
                        }`}
                      >
                        {/* Rank & Player */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 text-center shrink-0">
                            {isFirst && <Crown className="w-5 h-5 text-[#E9B949] mx-auto fill-[#E9B949]" />}
                            {isSecond && <Medal className="w-5 h-5 text-slate-400 mx-auto fill-slate-300" />}
                            {isThird && <Medal className="w-5 h-5 text-amber-700 mx-auto fill-amber-600" />}
                            {!isFirst && !isSecond && !isThird && (
                              <span className="text-xs font-black text-[#607582]">#{entry.rank}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono font-bold truncate ${isUser ? 'text-[#087F8C] font-black' : 'text-[#183345]'}`}>
                                {entry.playerMasked}
                              </span>
                              {isUser && (
                                <span className="px-1.5 py-0.2 rounded-md bg-[#82C341] text-white text-[8px] font-black">
                                  YOU
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-[#183345]">
                            {entry.score.toLocaleString()} <span className="text-[10px] font-medium text-[#607582]">pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
};

