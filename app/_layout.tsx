import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OnboardingProvider } from '@/features/auth/providers/onboarding-provider';
import { SessionProvider } from '@/features/auth/providers/session-provider';
import { ThemePreviewProvider, useThemePreview } from '@/features/theme/providers/theme-preview-provider';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSession } from '@/hooks/use-session';
import { queryClient } from '@/lib/query-client';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { isReady, session } = useSession();
  const { navigationTheme } = useThemePreview();
  const {
    isReady: isOnboardingReady,
    shouldShowOnboarding,
    postOnboardingRoute,
  } = useOnboarding();
  const shouldForcePublicFlow = shouldShowOnboarding || Boolean(postOnboardingRoute);

  useEffect(() => {
    if (isReady && isOnboardingReady) {
      SplashScreen.hideAsync().catch(() => null);
    }
  }, [isOnboardingReady, isReady]);

  if (!isReady || !isOnboardingReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: navigationTheme.colors.background,
        },
      }}>
      <Stack.Protected guard={!session || shouldForcePublicFlow}>
        <Stack.Screen name="(public)" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(session) && !shouldForcePublicFlow}>
        <Stack.Screen name="(protected)" />
      </Stack.Protected>
    </Stack>
  );
}

function ThemedRootNavigator() {
  const { navigationTheme } = useThemePreview();

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style="light" />
      <RootNavigator />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <OnboardingProvider>
              <ThemePreviewProvider>
                <ThemedRootNavigator />
              </ThemePreviewProvider>
            </OnboardingProvider>
          </SessionProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
