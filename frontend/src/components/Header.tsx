/**
 * GameON Tele - Native telebirr SuperApp Mini-App Header
 * 
 * Strict Layout Rules:
 * - NO EthioTelecom corporate logo in header.
 * - Left: telebirr SuperApp indicator ("telebirr Game Center")
 * - Center: "GAMEON TELE" brand wordmark
 * - Right: Coin balance chip (`🪙 50`) + "BUY COINS" / Add action
 */

import React from 'react';
import { UserProfile } from '../types';
import { Menu, Plus } from 'lucide-react';
import { GoPlayLogo } from './GoPlayLogo';

interface HeaderProps {
  profile?: UserProfile;
  onOpenBuyCoins: () => void;
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenBuyCoins,
  onOpenMenu,
}) => {
  const coinsCount = profile?.coins ?? 0;

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.04)] select-none pt-[env(safe-area-inset-top,0px)]">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 min-h-[58px]">
        
        {/* 1. LEFT: Menu button & GoPlay Brand Anchor */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenMenu && (
            <button
              id="header-main-menu-btn"
              type="button"
              onClick={onOpenMenu}
              aria-label="Open GoPlay Menu"
              className="p-1.5 rounded-xl text-[#17202A] hover:bg-slate-100 active:scale-95 transition-colors cursor-pointer"
              title="Menu"
            >
              <Menu className="w-5 h-5 stroke-[2.2]" />
            </button>
          )}

          {/* GoPlay Brand Identity */}
          <div 
            id="header-goplay-brand"
            className="flex items-center cursor-pointer px-0.5 transition-transform active:scale-98"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="GoPlay"
          >
            <GoPlayLogo size="lg" className="h-7 sm:h-8" />
          </div>
        </div>

        {/* 2. RIGHT: Coins Balance Chip & Instant Topup */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="header-buy-coins-btn"
            type="button"
            onClick={onOpenBuyCoins}
            aria-label="Buy Coins"
            className="group flex items-center gap-1.5 px-2.5 sm:px-3 h-[32px] sm:h-[34px] rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-black text-[11px] sm:text-xs transition-all shadow-xs cursor-pointer active:scale-95"
            title="Buy GoPlay Coins"
          >
            <span className="text-sm">🪙</span>
            <span className="font-black text-[#17202A]">{coinsCount}</span>
            <div className="w-4 h-4 rounded-full bg-[#8BCB3D] text-white flex items-center justify-center ml-0.5 group-hover:scale-110 transition-transform shadow-xs">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </button>
        </div>

      </div>
    </header>
  );
};
