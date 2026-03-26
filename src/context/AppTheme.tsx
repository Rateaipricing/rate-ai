import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TierColorSet {
  bar: string;
  bg: string;
  text: string;
}

export interface AppThemeColors {
  primary: string;
  tiers: {
    A: TierColorSet;
    B: TierColorSet;
    C: TierColorSet;
    D: TierColorSet;
    E: TierColorSet;
  };
}

export const DEFAULT_THEME: AppThemeColors = {
  primary: '#a70707',
  tiers: {
    E: { bg: '#ecfeff', bar: '#06b6d4', text: '#0e7490' },
    D: { bg: '#fefce8', bar: '#eab308', text: '#854d0e' },
    C: { bg: '#f9fafb', bar: '#6b7280', text: '#374151' },
    B: { bg: '#fff7ed', bar: '#f97316', text: '#9a3412' },
    A: { bg: '#fef2f2', bar: '#ef4444', text: '#991b1b' },
  },
};

// ─── Colour palettes shown in the settings modal ─────────────────────────────

export const PRIMARY_SWATCHES = [
  '#a70707', '#dc2626', '#ef4444', '#f97316',
  '#eab308', '#22c55e', '#15803d', '#14b8a6',
  '#06b6d4', '#3b82f6', '#1d4ed8', '#7c3aed',
  '#a855f7', '#ec4899', '#be185d', '#374151',
];

/** Auto-generate a very light background tint from a bar/accent colour */
export function hexToLightBg(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#f9fafb';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r * 0.08 + 255 * 0.92)}${h(g * 0.08 + 255 * 0.92)}${h(b * 0.08 + 255 * 0.92)}`;
}

/** Auto-generate a dark text colour from a bar/accent colour */
export function hexToDarkText(hex: string): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return '#374151';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const h = (n: number) => Math.round(n).toString(16).padStart(2, '0');
  return `#${h(r * 0.55)}${h(g * 0.55)}${h(b * 0.55)}`;
}

export const TIER_SWATCHES: Record<keyof AppThemeColors['tiers'], TierColorSet[]> = {
  E: [
    { bar: '#06b6d4', bg: '#ecfeff', text: '#0e7490' },
    { bar: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    { bar: '#22c55e', bg: '#f0fdf4', text: '#15803d' },
    { bar: '#a855f7', bg: '#faf5ff', text: '#7e22ce' },
    { bar: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    { bar: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' },
  ],
  D: [
    { bar: '#eab308', bg: '#fefce8', text: '#854d0e' },
    { bar: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    { bar: '#84cc16', bg: '#f7fee7', text: '#3f6212' },
    { bar: '#06b6d4', bg: '#ecfeff', text: '#0e7490' },
    { bar: '#f97316', bg: '#fff7ed', text: '#9a3412' },
    { bar: '#fbbf24', bg: '#fefce8', text: '#92400e' },
  ],
  C: [
    { bar: '#6b7280', bg: '#f9fafb', text: '#374151' },
    { bar: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8' },
    { bar: '#8b5cf6', bg: '#f5f3ff', text: '#4c1d95' },
    { bar: '#14b8a6', bg: '#f0fdfa', text: '#0f766e' },
    { bar: '#475569', bg: '#f8fafc', text: '#1e293b' },
    { bar: '#78716c', bg: '#fafaf9', text: '#292524' },
  ],
  B: [
    { bar: '#f97316', bg: '#fff7ed', text: '#9a3412' },
    { bar: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
    { bar: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
    { bar: '#ec4899', bg: '#fdf2f8', text: '#9d174d' },
    { bar: '#8b5cf6', bg: '#f5f3ff', text: '#4c1d95' },
    { bar: '#06b6d4', bg: '#ecfeff', text: '#0e7490' },
  ],
  A: [
    { bar: '#ef4444', bg: '#fef2f2', text: '#991b1b' },
    { bar: '#a70707', bg: '#fff1f1', text: '#7f1d1d' },
    { bar: '#6b7280', bg: '#f9fafb', text: '#374151' },
    { bar: '#1f2937', bg: '#f3f4f6', text: '#111827' },
    { bar: '#b45309', bg: '#fffbeb', text: '#7c2d12' },
    { bar: '#0f172a', bg: '#f8fafc', text: '#0f172a' },
  ],
};

// ─── Context ─────────────────────────────────────────────────────────────────

interface AppThemeContextValue {
  theme: AppThemeColors;
  setPrimary: (color: string) => void;
  setTierColor: (tier: keyof AppThemeColors['tiers'], colors: TierColorSet) => void;
  resetToDefault: () => void;
}

const AppThemeContext = createContext<AppThemeContextValue>({
  theme: DEFAULT_THEME,
  setPrimary: () => {},
  setTierColor: () => {},
  resetToDefault: () => {},
});

const STORAGE_KEY = '@app_theme_v1';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<AppThemeColors>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setTheme(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const save = (t: AppThemeColors) => {
    setTheme(t);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  };

  return (
    <AppThemeContext.Provider
      value={{
        theme,
        setPrimary: (color) => save({ ...theme, primary: color }),
        setTierColor: (tier, tierColors) =>
          save({ ...theme, tiers: { ...theme.tiers, [tier]: tierColors } }),
        resetToDefault: () => save(DEFAULT_THEME),
      }}
    >
      {children}
    </AppThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(AppThemeContext);
