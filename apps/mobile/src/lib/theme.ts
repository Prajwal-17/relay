import { DefaultTheme, type Theme } from "expo-router/react-navigation";

import { COLORS } from "@/theme/palette";

/** Standard Reusables theme contract. Relay intentionally ships one light theme. */
export const THEME = {
  light: {
    background: COLORS.background,
    foreground: COLORS.foreground,
    card: COLORS.card,
    cardForeground: COLORS.foreground,
    popover: COLORS.card,
    popoverForeground: COLORS.foreground,
    primary: COLORS.primary,
    primaryForeground: COLORS["primary-foreground"],
    secondary: COLORS.muted,
    secondaryForeground: COLORS.foreground,
    muted: COLORS.muted,
    mutedForeground: COLORS["muted-foreground"],
    accent: COLORS.muted,
    accentForeground: COLORS.foreground,
    destructive: COLORS.destructive,
    destructiveForeground: COLORS["destructive-foreground"],
    border: COLORS.border,
    input: COLORS["border-strong"],
    ring: COLORS.ring,
    radius: "0.5rem",
    chart1: "#1f9d72",
    chart2: "#b44a68",
    chart3: COLORS["counter-accent"],
    chart4: "#5e7837",
    chart5: "#d18a12"
  }
} as const;

/** React Navigation theme kept in sync with Relay's Reusables color roles. */
export const NAV_THEME: { light: Theme } = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: THEME.light.primary,
      background: THEME.light.background,
      card: THEME.light.card,
      text: THEME.light.foreground,
      border: THEME.light.border,
      notification: THEME.light.destructive
    }
  }
};
