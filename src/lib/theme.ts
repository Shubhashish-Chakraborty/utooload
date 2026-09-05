/**
 * Design tokens — the single source of truth for the whole app.
 * Never hardcode a hex value in a component; pull it from here so a dark
 * theme is a palette swap later, not a rewrite.
 */
import type { TextStyle, ViewStyle } from "react-native";

export const colors = {
  // Brand
  primary: "#1E68DD",
  primaryPressed: "#154FAE",
  primaryLight: "#EAF2FE",
  primarySoft: "#F5F9FF",

  // Neutrals / surfaces
  background: "#FFFFFF",
  surface: "#F8FAFC",
  border: "#E2E8F0",

  // Text
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textOnPrimary: "#FFFFFF",

  // Status
  success: "#22C55E",
  successLight: "#E9FBEF",
  error: "#EF4444",
  errorLight: "#FEECEC",
  warning: "#F59E0B",
  warningLight: "#FFF7E6",

  // Disabled
  disabled: "#CBD5E1",
  disabledText: "#94A3B8",

  // Modal scrim (derived from textPrimary)
  scrim: "rgba(15, 23, 42, 0.45)",
} as const;

/** Base-4 scale. These are the only spacing values used in the app. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  button: 12,
  input: 12,
  card: 20,
  sheet: 20,
  pill: 999,
} as const;

/**
 * Inter, loaded in the root layout. If loading fails the platform falls back
 * to its system typeface — sizes and weights below still apply.
 */
export const fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
} as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 34 },
  h1: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16 },
} satisfies Record<string, TextStyle>;

/** Soft and minimal — this app should feel calm, not flashy. */
export const shadow = {
  shadowColor: "#0F172A",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} satisfies ViewStyle;

/** Minimum tap target (dp). The primary user of this app is not tech-savvy. */
export const MIN_TAP = 48;

export const iconStroke = 2;
