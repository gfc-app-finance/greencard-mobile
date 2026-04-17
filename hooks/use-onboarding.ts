import { useContext } from 'react';

import { OnboardingContext } from '@/features/auth/providers/onboarding-provider';

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }

  return context;
}
