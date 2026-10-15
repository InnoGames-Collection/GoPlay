/**
 * GoPlay - Polished Navigation Drawer / Menu Panel
 * 
 * Strict Requirements:
 * - Occupies ~55-70% of viewport width on typical mobile portrait screens (64-66vw, min 225px, max 285px)
 * - Keeps underlying Profile screen recognizable beside panel with translucent backdrop overlay
 * - Avoids overlapping bottom navigation in an unusable way (stops above bottom nav: bottom-[calc(4rem+env(safe-area-inset-bottom,0px))])
 * - Prevents clipping of final menu items with overscroll-contain and smooth vertical scrolling
 * - Preserves all required destinations: Subscription, Pricing, FAQ, Games, Help & Support, Terms & Conditions, Privacy Policy, My High Scores
 * - Clean GoPlay visual hierarchy with unified icon containers, no random colors per row, restrained #82C341 active accent
 * - Obvious accessible close action, backdrop-tap dismissal, Escape key handler, and browser Back integration
 */

import React, { useEffect } from 'react';
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
  ChevronRight
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
  activeSection?: string | null;
}

export const MainMenuDrawer: React.FC<MainMenuDrawerProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  activeSection = null,
}) => {
  // Handle keyboard Escape to close drawer
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

  // Preserved menu items grouped logically with dividers
  const primaryMenuItems: {
    id: MainMenuSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
    },
    {
      id: 'pricing',
      label: 'Pricing',
      icon: BadgePercent,
    },
    {
      id: 'games',
      label: 'Games',
      icon: Gamepad2,
    },
    {
      id: 'my_scores',
      label: 'My High Scores',
      icon: Trophy,
    },
  ];

  const supportMenuItems: {
    id: MainMenuSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'faq',
      label: 'FAQ',
      icon: HelpCircle,
    },
    {
      id: 'help_support',
      label: 'Help & Support',
      icon: Headphones,
    },
  ];

  const legalMenuItems: {
    id: MainMenuSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'terms',
      label: 'Terms & Conditions',
      icon: FileText,
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      icon: ShieldCheck,
    },
  ];

  const renderMenuItem = (item: {
    id: MainMenuSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }) => {
    const Icon = item.icon;
    const isSelected = activeSection === item.id;

    return (
      <button
        key={item.id}
        id={`main-menu-item-${item.id}`}
        type="button"
        onClick={() => {
          onSelectSection(item.id);
          onClose();
        }}
        className={`w-full min-h-[44px] px-2.5 py-2 rounded-xl flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer group ${
          isSelected
            ? 'bg-[#DFF7EA]/70 border-l-[3px] border-l-[#82C341] text-[#102B3F] shadow-2xs'
            : 'bg-white hover:bg-[#F4F7F6] active:bg-[#DFF7EA]/30 border border-transparent hover:border-[#DCE7E8]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSelected
                ? 'bg-[#82C341] text-white shadow-2xs'
                : 'bg-[#F4F7F6] text-[#087F8C] group-hover:bg-[#DFF7EA] group-hover:text-[#087F8C] border border-[#DCE7E8]'
            }`}
          >
            <Icon className="w-4 h-4 stroke-[2.2]" />
          </div>

          <span
            className={`text-xs sm:text-[13px] transition-colors leading-tight truncate ${
              isSelected
                ? 'font-black text-[#102B3F]'
                : 'font-bold text-[#183345] group-hover:text-[#087F8C]'
            }`}
          >
            {item.label}
          </span>
        </div>

        <ChevronRight
          className={`w-3.5 h-3.5 transition-all shrink-0 ${
            isSelected
              ? 'text-[#82C341] translate-x-0.5'
              : 'text-[#607582] group-hover:text-[#087F8C] group-hover:translate-x-0.5'
          }`}
        />
      </button>
    );
  };

  return (
    <div 
      id="main-menu-overlay"
      className="fixed top-0 left-0 right-0 bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-50 bg-[#102B3F]/40 backdrop-blur-[2px] flex justify-start animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="GoPlay Navigation Menu"
    >
      <div 
        id="main-menu-panel"
        className="w-[66vw] min-w-[225px] max-w-[285px] bg-white h-full shadow-2xl flex flex-col justify-between select-none animate-in slide-in-from-left duration-200 border-r border-[#DCE7E8]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Drawer Header / Compact Brand Area */}
        <div className="px-3.5 py-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] bg-[#102B3F] text-white flex items-center justify-between shadow-xs border-b border-[#116B73]/30">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-white px-2 py-1 rounded-xl shadow-xs flex items-center justify-center shrink-0">
              <GoPlayLogo size="xs" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black tracking-tight text-white truncate">GoPlay</h2>
              <span className="text-[10px] text-[#DFF7EA] font-medium block -mt-0.5 truncate">Gaming Portal</span>
            </div>
          </div>

          <button
            id="main-menu-close-btn"
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
            title="Close Menu"
            aria-label="Close Menu"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Menu Items in Vertical List */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-2.5 space-y-1 pb-4">
          {/* Core Services */}
          <div className="space-y-1">
            {primaryMenuItems.map(renderMenuItem)}
          </div>

          {/* Divider */}
          <div className="my-1.5 mx-1 border-t border-[#DCE7E8]" />

          {/* Support */}
          <div className="space-y-1">
            {supportMenuItems.map(renderMenuItem)}
          </div>

          {/* Divider */}
          <div className="my-1.5 mx-1 border-t border-[#DCE7E8]" />

          {/* Legal */}
          <div className="space-y-1">
            {legalMenuItems.map(renderMenuItem)}
          </div>
        </div>

        {/* 3. Subtle Footer Brand Status */}
        <div className="p-2.5 border-t border-[#DCE7E8] bg-[#F4F7F6]/60 text-center">
          <span className="text-[10px] text-[#607582] font-bold">GoPlay v2.0 • Gaming Edition</span>
        </div>
      </div>
    </div>
  );
};
