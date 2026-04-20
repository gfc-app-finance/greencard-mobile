import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  AuthConfirmationScreen,
  type AuthConfirmationStatus,
} from '@/features/auth/components/auth-confirmation-screen';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSession } from '@/hooks/use-session';
import { toErrorMessage } from '@/lib/errors';
import { completeEmailConfirmation } from '@/services/auth-service';

type ConfirmationState = {
  status: AuthConfirmationStatus;
  message: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
};

const initialState: ConfirmationState = {
  status: 'pending',
  message: 'We are securely confirming your email and preparing your account access.',
};

export default function AuthConfirmScreen() {
  const router = useRouter();
  const linkingUrl = Linking.useLinkingURL();
  const handledUrlRef = useRef<string | null>(null);
  const [state, setState] = useState<ConfirmationState>(initialState);
  const { finishOnboardingFlow, clearPostOnboardingRoute } = useOnboarding();
  const { refreshSession } = useSession();
  const currentUrl = useMemo(
    () =>
      linkingUrl ??
      Linking.getLinkingURL() ??
      (typeof window !== 'undefined' ? window.location.href : null),
    [linkingUrl],
  );

  useEffect(() => {
    if (!currentUrl || handledUrlRef.current === currentUrl) {
      return;
    }

    const confirmedUrl = currentUrl;

    handledUrlRef.current = confirmedUrl;
    let isActive = true;

    async function confirmEmail() {
      try {
        const result = await completeEmailConfirmation(confirmedUrl);

        await finishOnboardingFlow();
        clearPostOnboardingRoute();
        await refreshSession();

        if (!isActive) {
          return;
        }

        if (result.session) {
          setState({
            status: 'success',
            message: result.message,
          });

          router.replace('/home');
          return;
        }

        setState({
          status: 'success',
          message: result.message,
          primaryActionLabel: 'Go to log in',
        });
      } catch (error) {
        if (!isActive) {
          return;
        }

        setState({
          status: 'error',
          message: toErrorMessage(
            error,
            'We could not complete your email confirmation.',
          ),
          primaryActionLabel: 'Back to log in',
          secondaryActionLabel: 'Create account',
        });
      }
    }

    void confirmEmail();

    return () => {
      isActive = false;
    };
  }, [
    clearPostOnboardingRoute,
    currentUrl,
    finishOnboardingFlow,
    refreshSession,
    router,
  ]);

  return (
    <AuthConfirmationScreen
      status={state.status}
      message={state.message}
      primaryActionLabel={state.primaryActionLabel}
      onPrimaryAction={() =>
        router.replace(state.status === 'success' ? '/login' : '/login')
      }
      secondaryActionLabel={state.secondaryActionLabel}
      onSecondaryAction={() => router.replace('/signup')}
    />
  );
}
