/**
 * LifeOS v1 visual tokens.
 *
 * Canonical reference: docs/MISSION_CONTROL_VISUAL_CONTRACT.md
 * Keep values centralized; components should consume these tokens rather than
 * introducing competing palette/radius values.
 */
export const tokens = {
  colors: {
    background: "#0A0B0D",
    surface1: "#111318",
    surface2: "#151820",
    surface3: "#1A1F29",
    primary: "#3B82F6",
    primaryDeep: "#123569",
    primaryMid: "#0E2346",
    primaryDark: "#08111D",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    text: "#F8FAFC",
    muted: "#A1AAB8",
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 24,
    xl: 28,
  },
  shadow: {
    hero: "0 0 60px rgba(59,130,246,0.35)",
  },
} as const;

export type LifeOSTokens = typeof tokens;
