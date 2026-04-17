import { Stack,useRouter  } from 'expo-router';

import { GoovaAppStateProvider } from '@/features/app/providers/goova-app-state-provider';
import { PaymentFlowProvider } from '@/features/payments/providers/payment-flow-provider';
import { VerificationRequiredModal } from '@/features/verification/components/verification-required-modal';
import {
  useVerification,
  VerificationProvider,
} from '@/features/verification/providers/verification-provider';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';

function VerificationPromptHost() {
  const router = useRouter();
  const { hideVerificationPrompt, isPromptVisible, profile, promptCopy } =
    useVerification();

  return (
    <VerificationRequiredModal
      copy={promptCopy}
      onClose={hideVerificationPrompt}
      onVerifyNow={() => {
        hideVerificationPrompt();
        router.push(getVerificationJourneyRoute(profile) as never);
      }}
      visible={isPromptVisible}
    />
  );
}

export default function ProtectedLayout() {
  return (
    <VerificationProvider>
      <GoovaAppStateProvider>
        <PaymentFlowProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <VerificationPromptHost />
        </PaymentFlowProvider>
      </GoovaAppStateProvider>
    </VerificationProvider>
  );
}
