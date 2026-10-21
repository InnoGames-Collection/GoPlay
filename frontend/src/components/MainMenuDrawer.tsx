/**
 * GoPlay - Compact Horizontal Navigation Menu Panel
 * 
 * Strict Layout Requirements:
 * - Compact menu panel that does not occupy half or more of the screen area (<45vh height).
 * - Underlying page remains visible beneath with translucent backdrop overlay.
 * - Main menu actions arranged horizontally (Games, My High Scores, Subscription, Pricing).
 * - No more than three secondary action buttons side by side in a horizontal row (FAQ, Help & Support, Terms & Privacy).
 * - Clearly labelled Log Out action calling the established sign-out flow with confirmation.
 * - Accessible close control, outside-tap dismissal, and Escape key integration.
 */

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  BadgePercent, 
  HelpCircle, 
  Gamepad2, 
  Trophy,
  Headphones, 
  FileText, 
  ShieldCheck, 
  X, 
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { GoPlayLogo } from './GoPlayLogo';

export type MainMenuSection = 
  | 'subscription'
  | 'pricing'
  | 'faq'
  | 'games'
  | 'my_scores'
  | 'help_support'
  | 'terms'
  | 'privacy';

interface MainMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: MainMenuSection) => void;
  onSignOut?: () => void;
  activeSection?: string | null;
}

export const MainMenuDrawer: React.FC<MainMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  onSignOut,
  activeSection = null,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Handle keyboard Escape to close menu
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (section: MainMenuSection) => {
    onSelectSection(section);
    onClose();
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    onClose();
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <div 
      id="main-menu-overlay"
      className="fixed inset-0 z-50 bg-[#102B3F]/45 backdrop-blur-[2px] flex flex-col justify-start items-center p-2.5 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top,0px))] animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="GoPlay Navigation Menu"
    >
      <div 
        id="main-menu-panel"
        className="w-full max-w-md md:max-w-xl bg-white rounded-3xl shadow-2xl border border-[#DCE7E8] overflow-hidden select-none animate-in slide-in-from-top-4 duration-200 flex flex-col max-h-[46vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Compact Header Bar */}
        <div className="px-3.5 py-2.5 bg-[#102B3F] text-white flex items-center justify-between border-b border-[#116B73]/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white px-2 py-0.5 rounded-xl shadow-xs flex items-center justify-center shrink-0">
              <GoPlayLogo size="xs" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-black tracking-tight text-white leading-tight">GoPlay Menu</h2>
            </div>
          </div>

          <button
            id="main-menu-close-btn"
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Menu Content Container with Horizontal Flow */}
        <div className="p-3 space-y-2.5 overflow-y-auto overscroll-contain flex-1">
          {/* A. PRIMARY ACTIONS (Horizontal 4-column card layout) */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#607582] block mb-1.5 px-0.5">
              Main Activities
            </span>
            <div className="grid grid-cols-4 gap-2">
              <button
                id="main-menu-item-games"
                type="button"
                onClick={() => handleItemClick('games')}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 min-h-[64px] ${
                  activeSection === 'games'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F] shadow-xs'
                    : 'bg-[#F4F7F6]/80 hover:bg-[#DFF7EA]/40 border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-[#087F8C] shadow-2xs mb-1">
                  <Gamepad2 className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-black truncate w-full">Games</span>
              </button>

              <button
                id="main-menu-item-my_scores"
                type="button"
                onClick={() => handleItemClick('my_scores')}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 min-h-[64px] ${
                  activeSection === 'my_scores'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F] shadow-xs'
                    : 'bg-[#F4F7F6]/80 hover:bg-[#DFF7EA]/40 border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-[#E9B949] shadow-2xs mb-1">
                  <Trophy className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-black truncate w-full">High Scores</span>
              </button>

              <button
                id="main-menu-item-subscription"
                type="button"
                onClick={() => handleItemClick('subscription')}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 min-h-[64px] ${
                  activeSection === 'subscription'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F] shadow-xs'
                    : 'bg-[#F4F7F6]/80 hover:bg-[#DFF7EA]/40 border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-[#087F8C] shadow-2xs mb-1">
                  <CreditCard className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-black truncate w-full">Subscription</span>
              </button>

              <button
                id="main-menu-item-pricing"
                type="button"
                onClick={() => handleItemClick('pricing')}
                className={`flex flex-col items-center justify-center p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 min-h-[64px] ${
                  activeSection === 'pricing'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F] shadow-xs'
                    : 'bg-[#F4F7F6]/80 hover:bg-[#DFF7EA]/40 border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center text-[#82C341] shadow-2xs mb-1">
                  <BadgePercent className="w-4 h-4 stroke-[2.2]" />
                </div>
                <span className="text-[11px] font-black truncate w-full">Pricing</span>
              </button>
            </div>
          </div>

          {/* B. SECONDARY ACTIONS (Horizontal 3-column row) */}
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#607582] block mb-1.5 px-0.5">
              Support & Legal
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                id="main-menu-item-faq"
                type="button"
                onClick={() => handleItemClick('faq')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  activeSection === 'faq'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F]'
                    : 'bg-white hover:bg-[#F4F7F6] border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#087F8C] shrink-0" />
                <span className="truncate">FAQ</span>
              </button>

              <button
                id="main-menu-item-help_support"
                type="button"
                onClick={() => handleItemClick('help_support')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  activeSection === 'help_support'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F]'
                    : 'bg-white hover:bg-[#F4F7F6] border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <Headphones className="w-3.5 h-3.5 text-[#087F8C] shrink-0" />
                <span className="truncate">Support</span>
              </button>

              <button
                id="main-menu-item-terms"
                type="button"
                onClick={() => handleItemClick('terms')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  activeSection === 'terms'
                    ? 'bg-[#DFF7EA] border-[#82C341] text-[#102B3F]'
                    : 'bg-white hover:bg-[#F4F7F6] border-[#DCE7E8] text-[#183345]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[#087F8C] shrink-0" />
                <span className="truncate">Terms</span>
              </button>
            </div>
          </div>

          {/* C. BOTTOM ROW: LOG OUT ACTION */}
          <div className="pt-1 border-t border-[#DCE7E8]">
            <button
              id="main-menu-logout-btn"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-black text-xs uppercase flex items-center justify-center gap-2 cursor-pointer transition-colors active:scale-98"
            >
              <LogOut className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* 3. LOGOUT CONFIRMATION OVERLAY */}
        {showLogoutConfirm && (
          <div className="absolute inset-0 bg-[#102B3F]/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 text-center text-white animate-in fade-in duration-150">
            <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-black uppercase tracking-wide text-white mb-1">
              Log Out of GoPlay?
            </h3>
            <p className="text-[11px] text-slate-300 max-w-xs mb-3.5 leading-relaxed">
              Your authenticated session will be cleared. Saved scores and game progress are preserved.
            </p>
            <div className="flex items-center gap-2 w-full max-w-xs">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="main-menu-confirm-logout-btn"
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black uppercase cursor-pointer shadow-md"
              >
                Confirm Log Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
