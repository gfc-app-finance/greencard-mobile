import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { darkTheme, lightTheme } from '../theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme, setColorScheme } = useColorScheme();

  // Choose theme based on scheme, but fallback to lightTheme
  const themeVars = colorScheme === 'dark' ? darkTheme : lightTheme;

  // 1. Force light mode once at the start (to satisfy Wale's request)
  useEffect(() => {
    if (colorScheme !== 'light') {
      setColorScheme('light');
    }
  }, [colorScheme, setColorScheme]);

  // 2. Handle Web-specific CSS variables (Must be above return)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const root = document.documentElement;
    const vars: Record<string, string> = (themeVars as any).__cssVars ?? themeVars;

    for (const [key, value] of Object.entries(vars)) {
      root.style.setProperty(key, String(value));
    }

    root.classList.remove('light', 'dark');
    if (colorScheme) root.classList.add(colorScheme);
  }, [themeVars, colorScheme]);

  // 3. Final return (Everything else must be above this)
  return (
    <View style={themeVars} className="flex-1 bg-background">
      {children}
    </View>
  );
}
