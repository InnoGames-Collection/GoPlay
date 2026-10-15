/**
 * GoPlay - Official Game Catalog Page
 * 
 * Strict Architecture:
 * - Exactly 12-game catalog preserved in exact specified order:
 *   1. Crazy Color | 2. Candy Juicy
 *   3. Emoji Fun | 4. Pop Piano
 *   5. Word Legend | 6. Candy Crush
 *   7. Soccer Shooter | 8. Dama
 *   9. Button Soccer | 10. Soccer Ping Pong
 *   11. Bubble Sort | 12. Color Tap Sprint
 * - Mandatory two-column grid on mobile portrait (grid-cols-2)
 * - Clean Games Header with concise title and subtitle
 * - Functional search with instant clear & empty state
 * - Direct card launch (no unnecessary intermediate modals)
 * - Full compliance with GoPlay color identity
 */

import React, { useState, useMemo } from 'react';
import { GameDefinition, UserProfile } from '../types';
import { GameCatalog } from '../services/gameCatalog';
import { catalogGameToDefinition } from '../games/registry';
import { GameCard } from '../components/GameCard';
import { Search, X } from 'lucide-react';

interface GamesPageProps {
  games: GameDefinition[];
  profile: UserProfile;
  onLaunchGame: (game: GameDefinition) => void;
  initialCategory?: string;
  activeEntitlements?: Record<string, boolean>;
}

export const GamesPage: React.FC<GamesPageProps> = ({
  onLaunchGame,
  initialCategory = 'All Games',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');

  // Categories containing active games in official order
  const categories = useMemo(() => {
    return GameCatalog.getCategoriesWithGames();
  }, []);

  // Filter games while strictly preserving the mandatory catalog order
  const displayedGames = useMemo(() => {
    let result = GameCatalog.getAll();

    if (selectedCategory !== 'All Games') {
      result = result.filter(
        (g) => g.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.gameName.toLowerCase().includes(q) ||
          g.titleAmharic.includes(searchQuery) ||
          g.category.toLowerCase().includes(q) ||
          g.tagline.toLowerCase().includes(q) ||
          g.genre.toLowerCase().includes(q)
      );
    }

    return result.map(catalogGameToDefinition);
  }, [selectedCategory, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All Games');
  };

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#183345] pb-24 select-none">
      <div className="max-w-md md:max-w-xl lg:max-w-4xl mx-auto px-3.5 sm:px-4 pt-3 space-y-4">
        
        {/* =========================================================================
            1. CLEAN GAMES HEADER
           ========================================================================= */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#183345] tracking-tight">
              Games
            </h1>
            <p className="text-xs text-[#607582] font-semibold mt-0.5">
              12 titles ready to play
            </p>
          </div>
        </div>

        {/* =========================================================================
            2. SEARCH BAR & QUICK FILTERS
           ========================================================================= */}
        <div className="space-y-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#607582] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search games..."
              aria-label="Search games"
              className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white hover:bg-slate-50 focus:bg-white text-[#183345] text-xs sm:text-sm font-bold border border-[#DCE7E8] focus:border-[#087F8C] outline-none transition-all placeholder:text-[#607582] shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 text-[#183345] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Compact Category Pills */}
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-xs shrink-0 snap-start transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-[#82C341] text-white shadow-xs font-black'
                      : 'bg-white hover:bg-[#DFF7EA]/50 text-[#183345] border border-[#DCE7E8]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            3. MANDATORY TWO-COLUMN GAME CATALOG GRID
            - Mobile portrait screens: exactly 2 equal-width columns (grid-cols-2)
            - Tablet/Desktop: 2-3 columns with preserved card proportions
            - No horizontal overflow, consistent gaps and margins
           ========================================================================= */}
        <div className="space-y-3">
          {displayedGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {displayedGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onPlay={onLaunchGame}
                  layout="grid"
                />
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#DCE7E8] space-y-3 shadow-xs">
              <p className="text-sm font-bold text-[#607582]">
                No games found matching "{searchQuery}"
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 rounded-xl bg-[#82C341] hover:bg-[#72af36] text-white text-xs font-black cursor-pointer transition-colors active:scale-95 shadow-xs"
              >
                Reset Catalog
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default GamesPage;
