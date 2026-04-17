import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from 'react';

const ONBOARDING_STORAGE_KEY = 'goova:onboarding-complete';

type OnboardingContextValue = {
  hasCompletedOnboarding: boolean;
  isReady: boolean;
  shouldShowOnboarding: boolean;
  postOnboardingRoute: '/login' | '/signup' | null;
  markOnboardingSeen: () => Promise<void>;
  finishOnboardingFlow: (nextRoute?: '/login' | '/signup') => Promise<void>;
  clearPostOnboardingRoute: () => void;
};

export const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [postOnboardingRoute, setPostOnboardingRoute] = useState<'/login' | '/signup' | null>(
    null
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)
      .then((storedValue) => {
        if (!isMounted) {
          return;
        }

        const hasCompleted = storedValue === 'true';
        setHasCompletedOnboarding(hasCompleted);
        setShouldShowOnboarding(!hasCompleted);
        setIsReady(true);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setHasCompletedOnboarding(false);
        setShouldShowOnboarding(true);
        setIsReady(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function persistCompletion() {
    setHasCompletedOnboarding(true);

    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
    } catch {
      return;
    }
  }

  async function markOnboardingSeen() {
    await persistCompletion();
  }

  async function finishOnboardingFlow(nextRoute?: '/login' | '/signup') {
    if (nextRoute) {
      setPostOnboardingRoute(nextRoute);
    }

    setShouldShowOnboarding(false);
    await persistCompletion();
  }

  function clearPostOnboardingRoute() {
    setPostOnboardingRoute(null);
  }

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding,
        isReady,
        shouldShowOnboarding,
        postOnboardingRoute,
        markOnboardingSeen,
        finishOnboardingFlow,
        clearPostOnboardingRoute,
      }}>
      {children}
    </OnboardingContext.Provider>
  );
}
