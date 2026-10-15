/**
 * Mobile-First Bottom Navigation Bar for GoPlay
 * Redesigned strictly according to user reference specifications:
 * - Exactly 5 tabs: Home, Games, Tournament, Leaderboard, Profile
 * - Floating, softly elevated dock container (rounded capsule with soft ambient shadow)
 * - Slightly larger, high-fidelity, recognizable 3D-styled icons
 * - Dedicated color palettes per tab:
 *    * Home: Vivid green gradient active state, white dimensional house icon
 *    * Games: Purple/violet controller with white D-pad and action buttons
 *    * Tournament: Golden/amber championship trophy cup with handles and star
 *    * Leaderboard: Royal blue 3-tier podium with floating star over #1 pillar
 *    * Profile: Magenta/pink circular badge with white avatar silhouette
 * - Selected state: signature green gradient pill with soft glow and bottom accent indicator
 * - Unselected states: soft rounded light containers with dark navy title-case typography
 * - Equal-width columns (grid grid-cols-5), zero overflow or clipping on mobile widths
 */

import React from 'react';
import { NavigationTab } from '../types';

// ============================================================================
// BESPOKE HIGH-FIDELITY GAMING ICONS
// ============================================================================

/** 1. Home Icon: Dimensional House with Chimney and Arched Door */
const HomeIcon: React.FC<{ isSelected: boolean; className?: string }> = ({ isSelected, className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    {/* Chimney */}
    <path
      d="M17.5 4.5H19.5V8.5L17.5 7V4.5Z"
      fill={isSelected ? '#FFFFFF' : '#4AA400'}
      fillOpacity={isSelected ? 0.95 : 0.9}
    />
    {/* Main House Roof & Body */}
    <path
      d="M12 3L2.5 11.2C2.1 11.5 2.3 12.2 2.9 12.2H5V20.5C5 21.1 5.4 21.5 6 21.5H18C18.6 21.5 19 21.1 19 20.5V12.2H21.1C21.7 12.2 21.9 11.5 21.5 11.2L12 3Z"
      fill={isSelected ? '#FFFFFF' : '#5EBF00'}
    />
    {/* Arched Door */}
    <path
      d="M9.8 21.5V14.5C9.8 13.3 10.8 12.3 12 12.3C13.2 12.3 14.2 13.3 14.2 14.5V21.5H9.8Z"
      fill={isSelected ? '#4AA400' : '#FFFFFF'}
    />
    {/* Soft Roof Shine */}
    <path
      d="M12 4.2L5.8 9.5H18.2L12 4.2Z"
      fill="#FFFFFF"
      fillOpacity={isSelected ? 0.25 : 0.4}
    />
  </svg>
);

/** 2. Games Icon: Purple/Violet Ergonomic Gaming Controller */
const GamesIcon: React.FC<{ isSelected: boolean; className?: string }> = ({ isSelected, className = 'w-6 h-6' }) => {
  const bodyColor = isSelected ? '#FFFFFF' : '#7C3AED';
  const detailColor = isSelected ? '#4AA400' : '#FFFFFF';

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Controller Body */}
      <path
        d="M7 5H17C19.2 5 21 6.6 21.4 8.7L22.6 15.2C23 17.5 21.4 19.5 19.1 19.7C17.8 19.8 16.6 19.2 15.9 18.1L14.7 16H9.3L8.1 18.1C7.4 19.2 6.2 19.8 4.9 19.7C2.6 19.5 1 17.5 1.4 15.2L2.6 8.7C3 6.6 4.8 5 7 5Z"
        fill={bodyColor}
      />
      {/* Glossy Top Curve Highlight */}
      <path
        d="M7.5 6.2H16.5C18 6.2 19.2 7.1 19.6 8.5L20.2 11.2C18 10.3 15.1 9.8 12 9.8C8.9 9.8 6 10.3 3.8 11.2L4.4 8.5C4.8 7.1 6 6.2 7.5 6.2Z"
        fill="#FFFFFF"
        fillOpacity={isSelected ? 0.3 : 0.25}
      />
      {/* D-Pad on Left */}
      <path
        d="M6.8 9.5V13.5M4.8 11.5H8.8"
        stroke={detailColor}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Action Buttons on Right */}
      <circle cx="15.8" cy="10.4" r="0.9" fill={detailColor} />
      <circle cx="17.6" cy="12.2" r="0.9" fill={detailColor} />
      <circle cx="14" cy="12.2" r="0.9" fill={detailColor} />
      <circle cx="15.8" cy="14" r="0.9" fill={detailColor} />
    </svg>
  );
};

/** 3. Tournament Icon: Golden/Amber Championship Trophy Cup */
const TournamentIcon: React.FC<{ isSelected: boolean; className?: string }> = ({ isSelected, className = 'w-6 h-6' }) => {
  const trophyColor = isSelected ? '#FFFFFF' : '#F59E0B';
  const stemColor = isSelected ? '#E2E8F0' : '#D97706';
  const starColor = isSelected ? '#4AA400' : '#FFFFFF';

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Left Handle */}
      <path
        d="M6 6H4.2C2.8 6 1.7 7.1 1.7 8.5C1.7 10.3 3.1 11.8 4.9 11.8H6"
        stroke={trophyColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Right Handle */}
      <path
        d="M18 6H19.8C21.2 6 22.3 7.1 22.3 8.5C22.3 10.3 20.9 11.8 19.1 11.8H18"
        stroke={trophyColor}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      {/* Cup Bowl */}
      <path
        d="M5.5 4H18.5V9.8C18.5 13.4 15.6 16.3 12 16.3C8.4 16.3 5.5 13.4 5.5 9.8V4Z"
        fill={trophyColor}
      />
      {/* Shiny Rim Highlight */}
      <path
        d="M6.5 5.2H17.5V6.4H6.5V5.2Z"
        fill="#FFFFFF"
        fillOpacity={isSelected ? 0.35 : 0.35}
      />
      {/* Center Star */}
      <path
        d="M12 7.2L12.9 9L14.8 9.2L13.4 10.5L13.8 12.3L12 11.3L10.2 12.3L10.6 10.5L9.2 9.2L11.1 9L12 7.2Z"
        fill={starColor}
      />
      {/* Stem */}
      <path
        d="M10.8 16.3H13.2V18.8H10.8V16.3Z"
        fill={stemColor}
      />
      {/* Pedestal Base */}
      <path
        d="M7.8 19.2H16.2C16.8 19.2 17.2 19.6 17.2 20.2C17.2 20.8 16.8 21.2 16.2 21.2H7.8C7.2 21.2 6.8 20.8 6.8 20.2C6.8 19.6 7.2 19.2 7.8 19.2Z"
        fill={trophyColor}
      />
    </svg>
  );
};

/** 4. Leaderboard Icon: Royal Blue 3-Tier Podium with Floating Star */
const LeaderboardIcon: React.FC<{ isSelected: boolean; className?: string }> = ({ isSelected, className = 'w-6 h-6' }) => {
  const barColor = isSelected ? '#FFFFFF' : '#2563EB';
  const starColor = isSelected ? '#FFFFFF' : '#3B82F6';

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Floating 5-Point Star above Center Bar */}
      <path
        d="M12 1.8L13.1 4.2L15.6 4.5L13.7 6.3L14.2 8.8L12 7.5L9.8 8.8L10.3 6.3L8.4 4.5L10.9 4.2L12 1.8Z"
        fill={starColor}
      />
      {/* Left Column (Rank 2) */}
      <rect
        x="3.2"
        y="10.8"
        width="4.8"
        height="10.4"
        rx="1.6"
        fill={barColor}
        fillOpacity={isSelected ? 0.9 : 0.85}
      />
      {/* Center Column (Rank 1 - Tallest) */}
      <rect
        x="9.6"
        y="7.4"
        width="4.8"
        height="13.8"
        rx="1.6"
        fill={barColor}
      />
      {/* Right Column (Rank 3 - Shortest) */}
      <rect
        x="16"
        y="13.2"
        width="4.8"
        height="8"
        rx="1.6"
        fill={barColor}
        fillOpacity={isSelected ? 0.8 : 0.75}
      />
      {/* Subtle top pill highlights for depth */}
      <rect x="3.8" y="11.3" width="3.6" height="1" rx="0.5" fill="#FFFFFF" fillOpacity={isSelected ? 0.3 : 0.3} />
      <rect x="10.2" y="7.9" width="3.6" height="1" rx="0.5" fill="#FFFFFF" fillOpacity={isSelected ? 0.35 : 0.35} />
      <rect x="16.6" y="13.7" width="3.6" height="1" rx="0.5" fill="#FFFFFF" fillOpacity={isSelected ? 0.25 : 0.25} />
    </svg>
  );
};

/** 5. Profile Icon: Magenta/Pink Circular Badge with Solid White Avatar Silhouette */
const ProfileIcon: React.FC<{ isSelected: boolean; className?: string }> = ({ isSelected, className = 'w-6 h-6' }) => {
  const badgeColor = isSelected ? '#FFFFFF' : '#EC4899';
  const silhouetteColor = isSelected ? '#4AA400' : '#FFFFFF';

  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {/* Circular Badge Background */}
      <circle
        cx="12"
        cy="12"
        r="9.6"
        fill={badgeColor}
      />
      {/* Avatar Head */}
      <circle
        cx="12"
        cy="8.5"
        r="3"
        fill={silhouetteColor}
      />
      {/* Avatar Torso / Shoulders */}
      <path
        d="M6.8 18.2C7.3 15 9.5 13 12 13C14.5 13 16.7 15 17.2 18.2C15.7 19.6 13.9 20.4 12 20.4C10.1 20.4 8.3 19.6 6.8 18.2Z"
        fill={silhouetteColor}
      />
    </svg>
  );
};

// ============================================================================
// COMPONENT PROPS & MAIN IMPLEMENTATION
// ============================================================================

interface BottomNavProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  labels?: {
    home?: string;
    games?: string;
    tournament?: string;
    leaderboard?: string;
    profile?: string;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, labels }) => {
  // Format labels to Title Case ('Home', 'Games', 'Tournament', 'Leaderboard', 'Profile')
  const getDisplayLabel = (tabId: NavigationTab, fallback: string): string => {
    const custom = labels?.[tabId];
    const text = custom || fallback;
    if (!text) return '';
    // Normalize all-caps labels (e.g. 'TOURNAMENT' -> 'Tournament')
    if (text.length > 1 && text === text.toUpperCase()) {
      return text.charAt(0) + text.slice(1).toLowerCase();
    }
    return text;
  };

  const tabs = [
    {
      id: 'home' as NavigationTab,
      label: getDisplayLabel('home', 'Home'),
      icon: HomeIcon,
      unselectedBg: 'bg-[#F6FAF2]',
      hoverBg: 'bg-[#EDF6E5]',
    },
    {
      id: 'games' as NavigationTab,
      label: getDisplayLabel('games', 'Games'),
      icon: GamesIcon,
      unselectedBg: 'bg-[#F8F5FF]',
      hoverBg: 'bg-[#F2EDFE]',
    },
    {
      id: 'tournament' as NavigationTab,
      label: getDisplayLabel('tournament', 'Tournament'),
      icon: TournamentIcon,
      unselectedBg: 'bg-[#FFFDF3]',
      hoverBg: 'bg-[#FFF9E6]',
    },
    {
      id: 'leaderboard' as NavigationTab,
      label: getDisplayLabel('leaderboard', 'Leaderboard'),
      icon: LeaderboardIcon,
      unselectedBg: 'bg-[#F4F8FF]',
      hoverBg: 'bg-[#EAF1FF]',
    },
    {
      id: 'profile' as NavigationTab,
      label: getDisplayLabel('profile', 'Profile'),
      icon: ProfileIcon,
      unselectedBg: 'bg-[#FDF4F8]',
      hoverBg: 'bg-[#FCEAF3]',
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      role="navigation"
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 select-none pb-[env(safe-area-inset-bottom,0px)] pointer-events-none"
    >
      {/* Floating Elevated Capsule Container matching reference design */}
      <div className="pointer-events-auto max-w-md md:max-w-xl mx-auto mb-2.5 sm:mb-3 px-2.5 sm:px-4">
        <div className="bg-white/95 backdrop-blur-md rounded-[28px] sm:rounded-[30px] p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.12),0_2px_8px_rgba(15,23,42,0.05)] border border-slate-100 grid grid-cols-5 items-center gap-1 sm:gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`bottom-nav-${tab.id}`}
              data-nav-tab={tab.id.toUpperCase()}
              role="tab"
              aria-selected={isSelected}
              aria-label={tab.label}
              onClick={() => onTabChange(tab.id)}
              className={`group relative flex flex-col items-center justify-center h-[58px] min-[375px]:h-[62px] sm:h-[64px] px-1 rounded-[20px] min-[375px]:rounded-[22px] transition-all duration-200 ease-out cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-b from-[#70D600] via-[#5EBF00] to-[#4AA400] text-white shadow-[0_4px_14px_rgba(88,185,0,0.38)]'
                  : `${tab.unselectedBg} hover:${tab.hoverBg} text-[#183345]`
              }`}
            >
              {/* Icon Container with soft halo in active state */}
              <div
                className={`w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-transform duration-200 group-hover:scale-105 ${
                  isSelected ? 'bg-white/20 backdrop-blur-xs' : ''
                }`}
              >
                <Icon isSelected={isSelected} className="w-5 h-5 min-[375px]:w-6 min-[375px]:h-6" />
              </div>

              {/* Title Case Label */}
              <span
                className={`text-[9px] min-[375px]:text-[10px] sm:text-[10.5px] tracking-tighter min-[375px]:tracking-tight text-center truncate w-full leading-none ${
                  isSelected ? 'font-black text-white' : 'font-bold text-[#183345]'
                }`}
              >
                {tab.label}
              </span>

              {/* Green indicator accent underneath active tab matching reference photo */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#5EBF00] shadow-[0_1px_3px_rgba(88,185,0,0.5)]"
                />
              )}
            </button>
          );
        })}
        </div>
      </div>
    </nav>
  );
};
