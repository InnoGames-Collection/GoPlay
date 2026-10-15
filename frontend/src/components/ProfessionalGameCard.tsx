import React from 'react';
import { GameDefinition } from '../types';
import { Play } from 'lucide-react';
import { OriginalGameArtwork } from './OriginalGameArtwork';

export interface ProfessionalGameCardProps {
  game: GameDefinition;
  onPlay: (game: GameDefinition) => void;
  onClickDetails?: (game: GameDefinition) => void;
  layout?: 'carousel' | 'grid';
  hasActiveAccess?: boolean;
  className?: string;
}

/**
 * ProfessionalGameCard
 * 
 * Image-First Commercial Gaming Portal Card Architecture:
 * 
 * A. IMAGE AREA (.game-card-image)
 * - Fixed 16:10 aspect ratio matching official promotional artwork
 * - High-quality rendering with object-cover object-center
 * - Smooth top rounded corners matching card radius
 * - Dominant element of the card with subtle hover zoom
 * 
 * B. CARD SURFACE (.game-card)
 * - Pure white background (#FFFFFF) with subtle border (#DCE7E8)
 * - Clean rounded silhouette (rounded-2xl) and soft elevation
 * - Restrained pressed state (scale 0.98)
 * 
 * C. TITLE AREA (.game-card-info)
 * - Clean, readable game title in deep navy (#183345)
 * - Subtle category indicator in secondary text (#607582)
 * - Obvious, accessible launch indicator in GoPlay green (#82C341)
 * - Zero ratings, zero scores, zero multiple badges, zero long descriptions
 * 
 * D. INTERACTION
 * - Tapping anywhere on the card directly launches the game
 */
export const ProfessionalGameCard: React.FC<ProfessionalGameCardProps> = ({
  game,
  onPlay,
  layout = 'grid',
  className = '',
}) => {
  const handleLaunch = () => {
    onPlay(game);
  };

  return (
    <div
      id={`game-card-${game.id}`}
      onClick={handleLaunch}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleLaunch();
        }
      }}
      aria-label={`Play ${game.title}`}
      className={`game-card group relative rounded-2xl bg-white border border-[#DCE7E8] hover:border-[#82C341]/60 shadow-xs hover:shadow-md active:scale-[0.98] transition-all duration-200 overflow-hidden cursor-pointer flex flex-col select-none ${
        layout === 'carousel'
          ? 'w-[280px] xs:w-[300px] shrink-0 snap-start'
          : 'w-full'
      } ${className}`}
    >
      {/* =========================================================================
          ZONE 1: DOMINANT ARTWORK HERO CONTAINER (IMAGE FIRST)
         ========================================================================= */}
      <div className="game-card-image relative w-full aspect-[16/10] overflow-hidden bg-[#102B3F]/5 shrink-0 rounded-t-2xl">
        <OriginalGameArtwork 
          gameId={game.id} 
          src={game.bannerUrl || game.thumbnailUrl}
          alt={`${game.title} artwork`}
          className="w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105" 
        />
      </div>

      {/* =========================================================================
          ZONE 2: CLEAN WHITE TITLE & LAUNCH FOOTER
         ========================================================================= */}
      <div className="game-card-info p-3 bg-white flex items-center justify-between gap-2.5 min-w-0 flex-1 border-t border-[#DCE7E8]/60">
        <div className="min-w-0 flex-1">
          <h3 
            title={game.title}
            className="text-[13.5px] sm:text-[15px] font-extrabold text-[#183345] tracking-tight leading-snug truncate group-hover:text-[#087F8C] transition-colors"
          >
            {game.title}
          </h3>
          <p className="text-[10.5px] sm:text-[11.5px] font-semibold text-[#607582] truncate mt-0.5">
            {game.category}
          </p>
        </div>

        {/* Obvious accessible launch target */}
        <div 
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#82C341] group-hover:bg-[#72af36] text-white flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
          aria-hidden="true"
        >
          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
        </div>
      </div>
    </div>
  );
};

export default ProfessionalGameCard;
