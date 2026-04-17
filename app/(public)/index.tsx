import { Redirect } from 'expo-router';

import { AuthOnboardingCarousel } from '@/features/auth/components/auth-onboarding-carousel';
import { useOnboarding } from '@/hooks/use-onboarding';

export default function WelcomeScreen() {
  const { shouldShowOnboarding, postOnboardingRoute } = useOnboarding();

  if (!shouldShowOnboarding) {
    return <Redirect href={postOnboardingRoute ?? '/login'} />;
  }

  return <AuthOnboardingCarousel />;
}
