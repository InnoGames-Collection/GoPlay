import React from 'react';
const logoImg = '/assets/goplay-logo.png';

export interface GoPlayLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark'; // 'light' = black "PLAY" (default), 'dark' = white "PLAY" for dark backgrounds
  greenColor?: string;
  playColor?: string;
  useImage?: boolean;
}

/**
 * Official GoPlay Logo matching official asset and https://goplay.et
 * Vector geometry with exact 743:251 aspect ratio
 */
export const GoPlayLogo: React.FC<GoPlayLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'light',
  greenColor = '#82C341',
  playColor: customPlayColor,
  useImage = false,
}) => {
  // Proportional emblem heights maintaining official 743:251 aspect ratio
  const height = 
    size === 'xs' ? 20 :
    size === 'sm' ? 26 : 
    size === 'lg' ? 40 : 
    size === 'xl' ? 52 : 
    32;

  const playColor = customPlayColor ?? (variant === 'dark' ? '#FFFFFF' : '#183345');

  if (useImage) {
    return (
      <div 
        className={`inline-flex items-center select-none shrink-0 ${className}`}
        style={!className.includes('h-') ? { height: `${height}px` } : undefined}
      >
        <img
          src={logoImg}
          alt="GoPlay"
          height={height}
          style={{ height: `${height}px` }}
          className="w-auto h-full max-h-full object-contain select-none shrink-0 drop-shadow-xs"
          draggable={false}
        />
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center select-none shrink-0 ${className}`}
      style={!className.includes('h-') ? { height: `${height}px` } : undefined}
    >
      <svg
        height={height}
        viewBox="0 0 743 251"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-auto h-full max-h-full shrink-0 aspect-[743/251] drop-shadow-xs"
        aria-label="GoPlay Official Logo"
      >
        {/* GAME CONTROLLER FRAME (Top Right) */}
        <path
          d="M715,0c15.46,0,28,12.54,28,28v94c0,15.46-12.54,28-28,28h-237c-15.46,0-28-12.54-28-28V28C450,12.54,462.54,0,478,0h237ZM479,18c-6.08,0-11,4.92-11,11v93c0,6.07,4.92,11,11,11h236c6.08,0,11-4.93,11-11V29c0-6.08-4.92-11-11-11h-236Z"
          fill={greenColor}
        />

        {/* D-PAD PLUS (+) */}
        <path
          d="M549,65h25v21h-25v25h-21v-25h-25v-21h25v-25h21v25Z"
          fill={greenColor}
        />

        {/* CONTROLLER ACTION BUTTONS (Triangle arrangement) */}
        <path
          d="M654,55c0,7.18-5.82,13-13,13s-13-5.82-13-13,5.82-13,13-13,13,5.82,13,13Z"
          fill={greenColor}
        />
        <path
          d="M654,96c0,7.18-5.82,13-13,13s-13-5.82-13-13,5.82-13,13-13,13,5.82,13,13Z"
          fill={greenColor}
        />
        <path
          d="M689,75c0,7.18-5.82,13-13,13s-13-5.82-13-13,5.82-13,13-13,13,5.82,13,13Z"
          fill={greenColor}
        />

        {/* "O" GLYPH WITH VERTICAL CENTER SLIT */}
        <path
          d="M418.88,17.98c-7.91-11.98-19.66-17.98-35.26-17.98h-115.54c-15.47,0-27.17,5.99-35.08,17.98-6.75,10.12-10.12,23.5-10.12,40.14v133.87c0,16.52,3.37,29.9,10.12,40.14,7.91,11.98,19.61,17.98,35.08,17.98h115.54c15.59,0,27.34-5.99,35.26-17.98,6.75-10.24,10.12-23.62,10.12-40.14V58.12c0-16.64-3.37-30.02-10.12-40.14ZM333.84,165.63h-16.33v-80.16h16.33v80.16Z"
          fill={greenColor}
        />

        {/* "G" GLYPH WITH CIRCUIT NOTCH */}
        <path
          d="M111.84,101.8v47.44h-16.33v-63.77h111.84V0H45.2c-13.38,0-24.03,4.54-31.94,13.61C4.42,23.85,0,38.69,0,58.12v133.87c0,16.52,3.37,29.9,10.12,40.14,7.91,11.98,19.61,17.98,35.08,17.98h116.94c15.48,0,27.17-5.99,35.08-17.98,6.75-10.24,10.12-23.62,10.12-40.14v-90.18h-95.51Z"
          fill={greenColor}
        />

        {/* "PLAY" - P */}
        <path
          d="M519.15,169.63c-2.69-3.09-6.31-4.63-10.87-4.63h-55.28v85.09h34.14v-22.27h21.14c4.55,0,8.17-1.54,10.87-4.63,3.01-3.48,4.51-8.53,4.51-15.14v-23.28c0-6.61-1.5-11.66-4.51-15.14ZM492.87,204.19h-5.73v-15.56h5.73v15.56Z"
          fill={playColor}
        />

        {/* "PLAY" - L */}
        <path
          d="M527.93,250.09v-85.09h34.14v50.95h30.04v34.14h-64.19Z"
          fill={playColor}
        />

        {/* "PLAY" - A */}
        <path
          d="M663.97,171.12c-2.69-4.08-6.67-6.12-11.93-6.12h-39.31c-5.3,0-9.3,2.04-11.99,6.12-2.26,3.44-3.38,8-3.38,13.66v11.47h31.19v-9.83h5.73v15.56h-.4v.02h-18.7c-5.66,0-10.21,1.15-13.66,3.44-4.08,2.65-6.12,6.63-6.12,11.93v17.93c0,5.34,1.66,9.22,4.99,11.64,2.85,2.1,7.03,3.15,12.53,3.15h9.38c4.08,0,7.94-1.48,11.58-4.45v4.45h33.55v-65.32c0-5.66-1.15-10.21-3.44-13.66ZM634.26,229.31h-5.73v-17.1h5.73v17.1Z"
          fill={playColor}
        />

        {/* "PLAY" - Y */}
        <path
          d="M709.64,165v43.53h-5.73v-43.53h-30.85v34.68c0,5.5,1.15,9.86,3.44,13.06,2.59,3.69,6.53,5.54,11.81,5.58h21.33v5.73h-36.29v26.04h54.27c5.31,0,9.3-2.04,11.99-6.12,2.26-3.48,3.39-8.04,3.39-13.66v-65.32h-33.36Z"
          fill={playColor}
        />
      </svg>
    </div>
  );
};
