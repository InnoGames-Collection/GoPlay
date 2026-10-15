/**
 * GoPlay - My High Scores Page
 * Lists player's high scores across catalog games.
 */

import React from 'react';
import { ArrowLeft, Trophy } from 'lucide-react';
import { UserProfile } from '../../types';
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
  const games = GameCatalog.getAll();

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3.5 pt-3 select-none space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between gap-3 bg-[#102B3F] text-white p-3.5 rounded-2xl shadow-xs border border-[#116B73]/40">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                id="my-scores-back-btn"
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
              <h1 className="text-base font-black tracking-tight">My High Scores</h1>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#DCE7E8] overflow-hidden bg-white shadow-2xs divide-y divide-[#DCE7E8]">
        {games.map((game) => {
          const score = profile.highScores?.[game.gameId] ?? 0;
          return (
            <div key={game.gameId} className="p-3.5 flex items-center justify-between hover:bg-[#F4F7F6] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={game.thumbnailUrl || game.bannerUrl}
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
};
