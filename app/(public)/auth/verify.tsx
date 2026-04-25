import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Spacing } from '@/constants/theme';
import { AuthOtpVerificationScreen } from '@/features/auth/components/auth-otp-verification-screen';
import { AuthShell } from '@/features/auth/components/auth-shell';
import type { AuthVerificationStep } from '@/types/auth';

function toSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function toVerificationStep(value: string | undefined): AuthVerificationStep {
  return value === 'phone' ? 'phone' : 'email';
}

export default function AuthVerifyRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    email?: string | string[];
    phone?: string | string[];
    step?: string | string[];
  }>();

  const email = toSingleValue(params.email)?.trim().toLowerCase() ?? '';
  const phoneParam = toSingleValue(params.phone)?.trim() ?? '';
  const phone = phoneParam.length > 0 ? phoneParam : null;
  const step = toVerificationStep(toSingleValue(params.step));

  if (!email) {
    return (
      <AuthShell
        eyebrow="SETUP REQUIRED"
        title="We could not load your verification step"
        description="Start again from sign up so we know where to send your verification code."
      >
        <AppCard style={styles.card}>
          <NoticeBanner
            tone="error"
            message="This verification screen is missing the email address needed to confirm the account."
          />
          <AppButton title="Back to sign up" onPress={() => router.replace('/signup')} />
        </AppCard>
      </AuthShell>
    );
  }

  return <AuthOtpVerificationScreen email={email} phone={phone} initialStep={step} />;
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
});
