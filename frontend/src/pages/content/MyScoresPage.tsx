/**
 * GoPlay - My High Scores & Attempt History Page
 * 
 * Displays:
 * 1. All-time highest valid scores across all registered catalog games.
 * 2. Recent attempt history with outcome (Completed, Failed, Interrupted),
 *    active duration, points earned, and timestamp.
 */

import React, { useState } from 'react';
import { ArrowLeft, Trophy, History, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { UserProfile, GameAttemptRecord } from '../../types';
import { GameCatalog } from '../../services/gameCatalog';

interface MyScoresPageProps {
  profile: UserProfile;
  onBack?: () => void;
  showHeader?: boolean;
}

export const MyScoresPage: React.FC<MyScoresPageProps> = ({
  profile,
  onBack,
  showHeader = true,
}) => {
  const [activeView, setActiveView] = useState<'best_scores' | 'attempts'>('best_scores');
  const games = GameCatalog.getAll();
  const recentAttempts: GameAttemptRecord[] = profile.recentAttempts || [];

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (isoString?: string) => {
    if (!isoString) return 'Recent';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none space-y-3.5">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between gap-3 bg-[#102B3F] text-white p-3.5 rounded-2xl shadow-xs border border-[#116B73]/40">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                id="my-scores-back-btn"
                type="button"
                onClick={onBack}
                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                title="Go Back"
                aria-label="Go Back"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#E9B949] shrink-0" />
              <h1 className="text-base font-black tracking-tight">Scores & History</h1>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Switcher: Best Scores vs Attempt History */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveView('best_scores')}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeView === 'best_scores'
              ? 'bg-white text-[#102B3F] shadow-xs'
              : 'text-[#607582] hover:text-[#183345]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>All-Time Best</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveView('attempts')}
          className={`py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeView === 'attempts'
              ? 'bg-white text-[#102B3F] shadow-xs'
              : 'text-[#607582] hover:text-[#183345]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Recent Attempts ({recentAttempts.length})</span>
        </button>
      </div>

      {/* VIEW 1: All-Time Best Scores */}
      {activeView === 'best_scores' && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-[#607582] px-1 flex items-center justify-between">
            <span>Highest valid score achieved per game</span>
            <span>{games.length} Games</span>
          </div>

          <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-2xs divide-y divide-[#DCE7E8]">
            {games.map((game) => {
              const score = profile.highScores?.[game.gameId] ?? 0;
              const hasPlayed = score > 0;
              return (
                <div
                  key={game.gameId}
                  className="p-3.5 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={game.thumbnail || game.banner}
                      alt={game.gameName}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-900 shrink-0 border border-[#DCE7E8]"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-[#183345] truncate">
                        {game.gameName}
                      </div>
                      <div className="text-[10px] text-[#607582] capitalize">
                        {game.category || 'Standard Game'}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    {hasPlayed ? (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#DFF7EA] text-[#087F8C] font-mono font-black text-xs">
                        <Trophy className="w-3 h-3 text-[#087F8C]" />
                        <span>{score.toLocaleString()} pts</span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#607582] bg-slate-100 px-2.5 py-1 rounded-lg">
                        No attempts yet
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Recent Attempt History */}
      {activeView === 'attempts' && (
        <div className="space-y-3">
          <div className="text-[11px] font-bold text-[#607582] px-1 flex items-center justify-between">
            <span>Attempt record (separate from best score)</span>
            <span>{recentAttempts.length} Recorded</span>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#DCE7E8] text-center shadow-2xs space-y-2">
              <History className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-[#183345]">No attempts recorded yet</div>
              <p className="text-[11px] text-[#607582] max-w-xs mx-auto">
                Play any GoPlay game to record your attempts. Completed, failed, and interrupted runs will appear here without affecting your highest score.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-2xs divide-y divide-[#DCE7E8]">
              {recentAttempts.slice(0, 30).map((attempt) => {
                const isWin = attempt.outcome === 'win';
                const isLoss = attempt.outcome === 'loss';
                const isInterrupted = attempt.outcome === 'interrupted';

                return (
                  <div
                    key={attempt.id}
                    className="p-3.5 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {isWin && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                        {isLoss && <XCircle className="w-4 h-4 text-amber-600" />}
                        {isInterrupted && <AlertCircle className="w-4 h-4 text-slate-500" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-[#183345] truncate">
                          {attempt.gameTitle || attempt.gameId}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[#607582] mt-0.5">
                          <span
                            className={`font-black uppercase tracking-wider px-1.5 py-0.2 rounded text-[9px] ${
                              isWin
                                ? 'bg-emerald-100 text-emerald-700'
                                : isLoss
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isWin ? 'Completed' : isLoss ? 'Failed' : 'Interrupted'}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDuration(attempt.durationSeconds)}
                          </span>
                          <span>•</span>
                          <span>{formatTimestamp(attempt.timestamp)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-mono font-black text-xs text-[#183345]">
                        {attempt.score.toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
