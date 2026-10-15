/**
 * Tournament Card Component for TelePlay Ethiopia
 * White card surface, Deep Blue: #0057A8, Green: #78BE20
 * Displays Tournament status (Upcoming, Live, Ended), schedule,
 * entry requirements, reward pool, and player's current rank/score.
 */

import React from 'react';
import { Tournament, GameDefinition } from '../types';
import { 
  Trophy, 
  Calendar, 
  Users, 
  Clock, 
  Lock, 
  ArrowRight, 
  CheckCircle2, 
  Coins,
  AlertCircle
} from 'lucide-react';
import { formatCurrencyETB } from '../utils/formatters';

interface TournamentCardProps {
  tournament: Tournament;
  game?: GameDefinition;
  onEnter: (tournament: Tournament) => void;
  onViewDetails?: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  game,
  onEnter,
  onViewDetails,
}) => {
  const isLive = tournament.status === 'Live';
  const isUpcoming = tournament.status === 'Upcoming';
  const isEnded = tournament.status === 'Ended';

  const statusBadge = {
    Live: {
      bg: 'bg-[#DFF7EA] text-[#116B73] border-[#82C341]/40',
      dot: 'bg-[#82C341] animate-pulse',
      label: 'LIVE NOW',
    },
    Upcoming: {
      bg: 'bg-amber-50 text-amber-800 border-amber-300',
      dot: 'bg-amber-500',
      label: 'UPCOMING',
    },
    Ended: {
      bg: 'bg-slate-100 text-slate-600 border-slate-300',
      dot: 'bg-slate-400',
      label: 'ENDED',
    },
  }[tournament.status];

  return (
    <div
      id={`tournament-card-${tournament.id}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col justify-between bg-white ${
        isLive
          ? 'border-[#DCE7E8] hover:border-[#087F8C] shadow-sm hover:shadow-md'
          : isUpcoming
          ? 'border-[#DCE7E8] opacity-95'
          : 'border-[#DCE7E8] opacity-80'
      }`}
    >
      {/* Top Banner Image with Badges */}
      <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-[#F4F7F6]">
        <img
          src={tournament.bannerImage}
          alt={tournament.title}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isLive ? 'hover:scale-105' : 'grayscale-[30%]'
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Status Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span
            className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border shadow-sm backdrop-blur-md ${statusBadge.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`} />
            <span>{statusBadge.label}</span>
          </span>

          <span className="px-2 py-0.5 rounded-md bg-[#102B3F] text-white text-[10px] font-extrabold uppercase shadow-sm">
            {tournament.cycle}
          </span>
        </div>

        {/* Sponsor Tag */}
        <div className="absolute top-3 right-3 text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20">
          {tournament.sponsor}
        </div>

        {/* Game Title Tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold text-[#82C341] uppercase tracking-wider drop-shadow">
              {tournament.gameTitle}
            </div>
            <h3 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
              {tournament.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Card Content & Metrics */}
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between bg-white">
        {/* Prize Pool & Entry Fee */}
        <div className="grid grid-cols-2 gap-2 bg-[#F4F7F6] rounded-xl p-3 border border-[#DCE7E8]">
          <div>
            <div className="text-[10px] text-[#607582] font-bold uppercase tracking-wider flex items-center gap-1">
              <Trophy className="w-3 h-3 text-[#E9B949]" />
              <span>Prize Pool</span>
            </div>
            <div className="text-sm sm:text-base font-black text-[#102B3F] font-mono mt-0.5">
              {formatCurrencyETB(tournament.prizePoolETB)}
            </div>
          </div>

          <div className="text-right border-l border-[#DCE7E8] pl-2">
            <div className="text-[10px] text-[#607582] font-semibold uppercase">Entry Requirement</div>
            <div className="text-xs sm:text-sm font-black text-[#183345] font-mono mt-0.5">
              {tournament.entryFeeEnergy > 0 ? `${tournament.entryFeeEnergy * 10} Coins` : 'FREE'}
            </div>
          </div>
        </div>

        {/* Schedule & Requirements Info */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[#607582]">
            <span className="text-[#607582] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#607582]" /> Schedule:
            </span>
            <span className="font-semibold text-[#183345] font-mono text-[11px]">
              {tournament.startDate} – {tournament.endDate}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#607582]">
            <span className="text-[#607582] flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-[#607582]" /> Requirement:
            </span>
            <span className="font-semibold text-[#087F8C] text-[11px]">
              {tournament.entryRequirement}
            </span>
          </div>

          <div className="flex items-center justify-between text-[#607582]">
            <span className="text-[#607582] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#607582]" /> Contenders:
            </span>
            <span className="font-mono text-[#183345] font-bold text-[11px]">
              {tournament.participantsCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Player Standing Highlight */}
        {tournament.playerScore !== undefined && tournament.playerScore > 0 && (
          <div className="bg-[#DFF7EA]/50 border border-[#82C341]/30 rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#82C341] text-white font-black text-xs flex items-center justify-center font-mono">
                #{tournament.playerRank || '--'}
              </div>
              <div>
                <div className="text-[9px] text-[#102B3F] font-black uppercase">Your Standing</div>
                <div className="text-xs font-bold text-[#183345]">
                  Score: <span className="font-mono">{tournament.playerScore.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {tournament.hasSubmitted && (
              <span className="text-[10px] font-bold text-[#82C341] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Submitted
              </span>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-1">
          {isLive ? (
            <button
              id={`enter-tournament-btn-${tournament.id}`}
              onClick={() => onEnter(tournament)}
              className="w-full py-2.5 rounded-xl bg-[#82C341] hover:bg-[#72af36] text-white font-black text-xs sm:text-sm active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer"
            >
              <span>{tournament.hasSubmitted ? 'PLAY AGAIN / IMPROVE SCORE' : 'ENTER TOURNAMENT'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : isUpcoming ? (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-black text-xs cursor-not-allowed flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <Clock className="w-4 h-4" />
              <span>OPENS SOON ({tournament.startDate})</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-2.5 rounded-xl bg-[#F4F7F6] text-[#607582] font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5 uppercase tracking-wider"
            >
              <AlertCircle className="w-4 h-4" />
              <span>TOURNAMENT CONCLUDED</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

