import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';

import { darkTheme, lightTheme } from '../theme';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { colorScheme } = useColorScheme();
  const themeVars = colorScheme === 'dark' ? darkTheme : lightTheme;

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

  return (
    <View style={themeVars} className={`${colorScheme} flex-1 bg-background`}>
      {children}
    </View>
  );
}
