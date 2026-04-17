import { DefaultTheme, type Theme } from '@react-navigation/native';

export type AppColorPalette = {
  background: string;
  backgroundElevated: string;
  surface: string;
  surfaceSecondary: string;
  surfaceMuted: string;
  surfaceAccent: string;
  border: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  violet: string;
  violetSoft: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  white: string;
  shadow: string;
};

export type ThemePreviewId = 'goova' | 'ocean' | 'graphite' | 'forest' | 'ivory';

export const themePreviewPalettes: Record<ThemePreviewId, AppColorPalette> = {
  goova: {
    background: '#F7F7F2',
    backgroundElevated: '#F2F2EC',
    surface: '#FFFFFF',
    surfaceSecondary: '#FBFBF9',
    surfaceMuted: '#F0F4F3',
    surfaceAccent: '#DFF4F1',
    border: '#E7E5E4',
    text: '#171717',
    textMuted: '#6B7280',
    textSubtle: '#9CA3AF',
    primary: '#0F766E',
    primaryStrong: '#0F766E',
    primarySoft: '#DFF4F1',
    violet: '#6B7280',
    violetSoft: '#F0F4F3',
    secondary: '#B7791F',
    success: '#15803D',
    warning: '#B7791F',
    danger: '#C24141',
    white: '#FFFFFF',
    shadow: '#171717',
  },
  ocean: {
    background: '#06111C',
    backgroundElevated: '#0A1928',
    surface: '#0F2030',
    surfaceSecondary: '#142A3D',
    surfaceMuted: '#18334A',
    surfaceAccent: '#14243D',
    border: 'rgba(125, 168, 214, 0.18)',
    text: '#F3F8FF',
    textMuted: '#9AB2CC',
    textSubtle: '#6D88A6',
    primary: '#7DD3FC',
    primaryStrong: '#38BDF8',
    primarySoft: 'rgba(56, 189, 248, 0.16)',
    violet: '#60A5FA',
    violetSoft: 'rgba(96, 165, 250, 0.14)',
    secondary: '#F2C572',
    success: '#34D399',
    warning: '#F2C572',
    danger: '#FB7185',
    white: '#FFFFFF',
    shadow: '#000000',
  },
  graphite: {
    background: '#07080B',
    backgroundElevated: '#111317',
    surface: '#171A20',
    surfaceSecondary: '#1D222A',
    surfaceMuted: '#252C36',
    surfaceAccent: '#22202B',
    border: 'rgba(163, 163, 163, 0.18)',
    text: '#FAFAF9',
    textMuted: '#A8ADB7',
    textSubtle: '#777E89',
    primary: '#FDE68A',
    primaryStrong: '#F5D27B',
    primarySoft: 'rgba(245, 210, 123, 0.14)',
    violet: '#A78BFA',
    violetSoft: 'rgba(167, 139, 250, 0.14)',
    secondary: '#FCA5A5',
    success: '#4ADE80',
    warning: '#F5D27B',
    danger: '#FB7185',
    white: '#FFFFFF',
    shadow: '#000000',
  },
  forest: {
    background: '#04100D',
    backgroundElevated: '#091814',
    surface: '#10221D',
    surfaceSecondary: '#153029',
    surfaceMuted: '#1D3A31',
    surfaceAccent: '#153028',
    border: 'rgba(110, 231, 183, 0.18)',
    text: '#F4FEFA',
    textMuted: '#9FC4B9',
    textSubtle: '#6E958B',
    primary: '#86EFAC',
    primaryStrong: '#4ADE80',
    primarySoft: 'rgba(74, 222, 128, 0.14)',
    violet: '#2DD4BF',
    violetSoft: 'rgba(45, 212, 191, 0.14)',
    secondary: '#FACC15',
    success: '#4ADE80',
    warning: '#FACC15',
    danger: '#FB7185',
    white: '#FFFFFF',
    shadow: '#000000',
  },
  ivory: {
    background: '#F5F7FB',
    backgroundElevated: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    surfaceMuted: '#E2E8F0',
    surfaceAccent: '#EEF2FF',
    border: 'rgba(15, 23, 42, 0.16)',
    text: '#0F172A',
    textMuted: '#334155',
    textSubtle: '#64748B',
    primary: '#38BDF8',
    primaryStrong: '#14B8A6',
    primarySoft: 'rgba(20, 184, 166, 0.16)',
    violet: '#6366F1',
    violetSoft: 'rgba(99, 102, 241, 0.16)',
    secondary: '#F59E0B',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    white: '#FFFFFF',
    shadow: '#020617',
  },
};

export const defaultThemePreviewId: ThemePreviewId = 'goova';

export const Colors: AppColorPalette = {
  ...themePreviewPalettes[defaultThemePreviewId],
};

export function buildNavigationTheme(palette: AppColorPalette): Theme {
  return {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: palette.primaryStrong,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.danger,
    },
  };
}

export let NavigationTheme: Theme = buildNavigationTheme(Colors);

export function applyThemePreview(themeId: ThemePreviewId) {
  const palette = themePreviewPalettes[themeId];

  Object.assign(Colors, palette);
  NavigationTheme = buildNavigationTheme(Colors);

  return palette;
}
