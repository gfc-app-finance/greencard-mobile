import { Redirect, Stack, usePathname } from 'expo-router';

import { useOnboarding } from '@/hooks/use-onboarding';

export default function PublicLayout() {
  const pathname = usePathname();
  const { isReady, shouldShowOnboarding } = useOnboarding();

  if (!isReady) {
    return null;
  }

  if (shouldShowOnboarding && pathname !== '/') {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
