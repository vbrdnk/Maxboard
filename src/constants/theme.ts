/**
 * Maxboard design tokens — dark theme only (PRD §Design Requirements).
 *
 * This is a gym tool: glanceable at arm's length, monospace data, lime accent
 * used sparingly. No light mode. See PRD "Visual Direction".
 */

import { Platform } from 'react-native';

export const Colors = {
  /** Near-black app background. */
  bg: '#0a0a0a',
  /** Dark gray card surface. */
  card: '#1a1a1a',
  /** Slightly lighter surface for nested rows / inputs. */
  surface: '#212225',
  /** Alternating percentage-table row background (subtle stripe). */
  rowAlt: '#141414',
  /** Chartreuse/lime accent — interactive elements, 90/95/100% rows. Use sparingly. */
  accent: '#c8ff00',
  /** Primary text. */
  text: '#ffffff',
  /** Secondary / muted text (entry counts, footnotes, the "—" placeholder). */
  textMuted: '#8a8f98',
  /** Even more subdued (disabled, dividers as text). */
  textFaint: '#5a5f68',
  /** Hairline border / divider. */
  border: '#2a2a2a',
  /** Destructive (delete confirmations, swipe-to-delete). */
  danger: '#ff453a',
} as const;

export type ThemeColor = keyof typeof Colors;

/** Width of the lime left-accent border on cards (PRD: 3–4px). */
export const AccentBorderWidth = 4;

/**
 * Font families. All app *data* (names, weights, percentages) renders monospace
 * per PRD — SF Mono on iOS, Roboto Mono / monospace on Android, CSS var on web.
 */
export const Fonts = Platform.select({
  ios: {
    mono: 'ui-monospace',
    sans: 'system-ui',
  },
  default: {
    mono: 'monospace',
    sans: 'normal',
  },
  web: {
    mono: 'var(--font-mono)',
    sans: 'var(--font-display)',
  },
})!;

/** 4pt spacing scale. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Corner radius — PRD: 4–8px, no more. */
export const Radius = {
  sm: 4,
  md: 8,
} as const;

/** Font sizes. The 1RM value is the dominant element on each card. */
export const FontSize = {
  footnote: 12,
  body: 15,
  label: 13,
  title: 20,
  /** The big 1RM number on each card. */
  hero: 40,
} as const;

/** Minimum tap target (PRD: fat-finger tolerance, 48pt min). */
export const MinTapTarget = 48;
