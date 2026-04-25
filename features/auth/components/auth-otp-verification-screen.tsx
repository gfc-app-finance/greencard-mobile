import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { useOnboarding } from '@/hooks/use-onboarding';
import { useSession } from '@/hooks/use-session';
import { toErrorMessage } from '@/lib/errors';
import { maskPhoneNumber } from '@/lib/phone';
import {
  beginPhoneVerification,
  resendPhoneVerificationOtp,
  resendSignupEmailOtp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from '@/services/auth-service';
import type { AuthVerificationStep } from '@/types/auth';

type AuthOtpVerificationScreenProps = {
  email: string;
  phone: string | null;
  initialStep: AuthVerificationStep;
};

type BannerTone = 'info' | 'success' | 'error';

function sanitizeOtp(value: string) {
  return value.replace(/\D/g, '').slice(0, 6);
}

export function AuthOtpVerificationScreen({
  email,
  phone,
  initialStep,
}: AuthOtpVerificationScreenProps) {
  const router = useRouter();
  const { finishOnboardingFlow, clearPostOnboardingRoute } = useOnboarding();
  const { refreshSession } = useSession();
  const [step, setStep] = useState<AuthVerificationStep>(initialStep);
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [bannerMessage, setBannerMessage] = useState(() =>
    initialStep === 'email'
      ? `Enter the 6-digit email code we sent to ${email}.`
      : `Enter the 6-digit SMS code we sent to ${maskPhoneNumber(phone ?? '')}.`,
  );
  const [bannerTone, setBannerTone] = useState<BannerTone>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isPreparingPhoneStep, setIsPreparingPhoneStep] = useState(false);
  const [hasStartedPhoneVerification, setHasStartedPhoneVerification] = useState(
    initialStep !== 'phone',
  );

  const currentCode = step === 'email' ? emailCode : phoneCode;
  const maskedPhone = useMemo(() => maskPhoneNumber(phone ?? ''), [phone]);

  useEffect(() => {
    if (initialStep !== 'phone' || !phone || hasStartedPhoneVerification) {
      return;
    }

    const targetPhone = phone;
    setHasStartedPhoneVerification(true);
    let isActive = true;

    async function sendPhoneOtp() {
      setIsPreparingPhoneStep(true);

      try {
        await beginPhoneVerification(targetPhone);
        await refreshSession();

        if (!isActive) {
          return;
        }

        setBannerTone('info');
        setBannerMessage(`Enter the 6-digit SMS code we sent to ${maskedPhone}.`);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setBannerTone('error');
        setBannerMessage(
          toErrorMessage(
            error,
            'We could not send the SMS code yet. Confirm that phone auth is enabled in Supabase.',
          ),
        );
      } finally {
        if (isActive) {
          setIsPreparingPhoneStep(false);
        }
      }
    }

    void sendPhoneOtp();

    return () => {
      isActive = false;
    };
  }, [hasStartedPhoneVerification, initialStep, maskedPhone, phone, refreshSession]);

  async function finishAuthFlow() {
    await finishOnboardingFlow();
    clearPostOnboardingRoute();
    await refreshSession();
    router.replace('/home');
  }

  async function startPhoneVerificationFlow() {
    if (!phone) {
      await finishAuthFlow();
      return;
    }

    setStep('phone');
    setHasStartedPhoneVerification(true);
    setIsPreparingPhoneStep(true);

    try {
      await beginPhoneVerification(phone);
      await refreshSession();
      setBannerTone('info');
      setBannerMessage(`Enter the 6-digit SMS code we sent to ${maskedPhone}.`);
    } catch (error) {
      setBannerTone('error');
      setBannerMessage(
        toErrorMessage(
          error,
          'We could not send the SMS code yet. Confirm that phone auth is enabled in Supabase.',
        ),
      );
    } finally {
      setIsPreparingPhoneStep(false);
    }
  }

  async function handleVerifyCurrentStep() {
    setIsSubmitting(true);

    try {
      if (step === 'email') {
        await verifyEmailOtp(email, emailCode);
        await refreshSession();
        setEmailCode('');
        setBannerTone('success');
        setBannerMessage('Email confirmed. Preparing your SMS verification.');
        await startPhoneVerificationFlow();
        return;
      }

      if (!phone) {
        throw new Error('A phone number is required to finish SMS verification.');
      }

      await verifyPhoneOtp(phone, phoneCode);
      await refreshSession();
      setPhoneCode('');
      setBannerTone('success');
      setBannerMessage('Phone confirmed. Taking you into your Greencard account.');
      await finishAuthFlow();
    } catch (error) {
      setBannerTone('error');
      setBannerMessage(
        toErrorMessage(error, 'We could not verify that code. Please try again.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCurrentStep() {
    setIsResending(true);

    try {
      if (step === 'email') {
        await resendSignupEmailOtp(email);
        setBannerTone('success');
        setBannerMessage(`We sent a fresh email code to ${email}.`);
      } else {
        if (!phone) {
          throw new Error('A phone number is required to resend the SMS code.');
        }

        await resendPhoneVerificationOtp(phone);
        setBannerTone('success');
        setBannerMessage(`We sent a fresh SMS code to ${maskedPhone}.`);
      }
    } catch (error) {
      setBannerTone('error');
      setBannerMessage(
        toErrorMessage(
          error,
          'We could not resend the code right now. Please try again.',
        ),
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthShell
      eyebrow={step === 'email' ? 'VERIFY EMAIL' : 'VERIFY PHONE'}
      title={
        step === 'email'
          ? 'Enter your email verification code'
          : 'Enter your SMS verification code'
      }
      description={
        step === 'email'
          ? 'Stay inside the app and confirm your account with the one-time code we sent to your inbox.'
          : 'We use a second one-time code to confirm your phone number before opening your account workspace.'
      }
    >
      <AppCard style={styles.card}>
        <NoticeBanner message={bannerMessage} tone={bannerTone} />

        <View style={styles.destinationBlock}>
          <Text style={styles.destinationLabel}>
            {step === 'email' ? 'Delivery target' : 'SMS delivery target'}
          </Text>
          <Text style={styles.destinationValue}>
            {step === 'email' ? email : maskedPhone}
          </Text>
        </View>

        <AppInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="number-pad"
          label={step === 'email' ? 'Email code' : 'SMS code'}
          maxLength={6}
          onChangeText={(value) =>
            step === 'email'
              ? setEmailCode(sanitizeOtp(value))
              : setPhoneCode(sanitizeOtp(value))
          }
          placeholder="123456"
          textContentType="oneTimeCode"
          value={currentCode}
          helperText="Codes are 6 digits."
        />

        <AppButton
          title={step === 'email' ? 'Verify email code' : 'Verify SMS code'}
          loading={isSubmitting || isPreparingPhoneStep}
          disabled={currentCode.length !== 6}
          onPress={() => {
            void handleVerifyCurrentStep();
          }}
        />

        <AppButton
          title={step === 'email' ? 'Resend email code' : 'Resend SMS code'}
          variant="secondary"
          loading={isResending}
          onPress={() => {
            void handleResendCurrentStep();
          }}
        />

        <AppButton
          title="Back to log in"
          variant="ghost"
          onPress={() => router.replace('/login')}
        />
      </AppCard>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  destinationBlock: {
    gap: Spacing.xs,
  },
  destinationLabel: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  destinationValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
