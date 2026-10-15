/**
 * GoPlay Controlled Professional Gaming Theme Tokens
 * Strict Specification Palette:
 * - GoPlay Brand Green: #82C341 (Primary actions, active states)
 * - Deep Navy: #102B3F (Headers, hero panels, dark surfaces)
 * - Teal: #087F8C (Secondary accents, links, hover borders)
 * - Rich Teal: #116B73 (Card accents, gradients)
 * - Soft Mint: #DFF7EA (Subtle selection backgrounds, active pill tints)
 * - White: #FFFFFF (Card surfaces, clean panels)
 * - Warm Light Neutral: #F4F7F6 (Page backgrounds, container surfaces)
 * - Primary Dark Text: #183345 (Headings, primary labels)
 * - Secondary Text: #607582 (Subtitles, descriptions, metadata)
 * - Subtle Border: #DCE7E8 (Card and divider borders)
 * - Restrained Premium Gold: #E9B949 (Achievements, top ranks, trophies)
 */

export const THEME = {
  colors: {
    brandGreen: '#82C341',
    brandGreenHover: '#72af36',
    deepNavy: '#102B3F',
    deepNavySurface: '#163852',
    teal: '#087F8C',
    tealHover: '#076f7b',
    tealRich: '#116B73',
    richTeal: '#116B73',
    softMint: '#DFF7EA',
    white: '#FFFFFF',
    warmNeutral: '#F4F7F6',
    textPrimary: '#183345',
    primaryDark: '#183345',
    textSecondary: '#607582',
    secondaryText: '#607582',
    borderSubtle: '#DCE7E8',
    subtleBorder: '#DCE7E8',
    goldPremium: '#E9B949',
    gold: '#E9B949',
  },
  radii: {
    sm: '0.5rem',     // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px - standard card radius
    xl: '1.25rem',    // 20px
    full: '9999px',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
} as const;

export const GOPLAY_THEME = THEME;
export default THEME;
