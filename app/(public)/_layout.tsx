import { Redirect, Stack, usePathname } from 'expo-router';

import { useOnboarding } from '@/hooks/use-onboarding';
import { isAuthConfirmationPath } from '@/lib/auth-deep-link';

export default function PublicLayout() {
  const pathname = usePathname();
  const { isReady, shouldShowOnboarding } = useOnboarding();

  if (!isReady) {
    return null;
  }

  if (shouldShowOnboarding && pathname !== '/' && !isAuthConfirmationPath(pathname)) {
    return <Redirect href="/" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
