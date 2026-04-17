import type { Theme } from '@react-navigation/native';
import { createContext, type PropsWithChildren,useContext, useEffect, useMemo, useState } from 'react';

import {
  applyThemePreview,
  buildNavigationTheme,
  Colors,
  defaultThemePreviewId,
  type ThemePreviewId,
  themePreviewPalettes,
} from '@/constants/colors';

type ThemePreviewOption = {
  id: ThemePreviewId;
  title: string;
  description: string;
  swatches: string[];
};

type ThemePreviewContextValue = {
  activeThemeId: ThemePreviewId;
  navigationTheme: Theme;
  options: ThemePreviewOption[];
  setActiveThemeId: (themeId: ThemePreviewId) => void;
};

const themePreviewOptions: ThemePreviewOption[] = [
  {
    id: 'goova',
    title: 'Greencard',
    description: 'The current mint-and-violet fintech palette.',
    swatches: ['#5EEAD4', '#8B5CF6', '#F5D27B'],
  },
  {
    id: 'ocean',
    title: 'Ocean',
    description: 'Cool blue surfaces with cleaner cyan accents.',
    swatches: ['#38BDF8', '#60A5FA', '#F2C572'],
  },
  {
    id: 'graphite',
    title: 'Graphite',
    description: 'A darker graphite base with warmer gold accents.',
    swatches: ['#F5D27B', '#A78BFA', '#FCA5A5'],
  },
  {
    id: 'forest',
    title: 'Forest',
    description: 'Deep green money-app tones with sharper emerald actions.',
    swatches: ['#4ADE80', '#2DD4BF', '#FACC15'],
  },
  {
    id: 'ivory',
    title: 'Ivory',
    description: 'Light white surfaces for contrast testing and visual QA.',
    swatches: ['#FFFFFF', '#14B8A6', '#6366F1'],
  },
];

const ThemePreviewContext = createContext<ThemePreviewContextValue | null>(null);

export function ThemePreviewProvider({ children }: PropsWithChildren) {
  const [activeThemeId, setActiveThemeId] = useState<ThemePreviewId>(defaultThemePreviewId);
  const [navigationTheme, setNavigationTheme] = useState<Theme>(() =>
    buildNavigationTheme(themePreviewPalettes[defaultThemePreviewId])
  );

  useEffect(() => {
    applyThemePreview(activeThemeId);
    setNavigationTheme(buildNavigationTheme(Colors));
  }, [activeThemeId]);

  const value = useMemo<ThemePreviewContextValue>(
    () => ({
      activeThemeId,
      navigationTheme,
      options: themePreviewOptions,
      setActiveThemeId,
    }),
    [activeThemeId, navigationTheme]
  );

  return <ThemePreviewContext.Provider value={value}>{children}</ThemePreviewContext.Provider>;
}

export function useThemePreview() {
  const context = useContext(ThemePreviewContext);

  if (!context) {
    throw new Error('useThemePreview must be used within ThemePreviewProvider.');
  }

  return context;
}
