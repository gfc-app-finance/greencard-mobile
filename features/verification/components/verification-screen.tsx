import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { PremiumScreenHeader } from '@/features/home/components/premium-screen-header';
import { VerificationProgressCard } from '@/features/verification/components/verification-progress-card';
import { useVerification } from '@/hooks/use-verification';

const REDIRECT_DELAY_MS = 1500;
const NON_DIGIT_PATTERN = /\D+/g;
const ID_MAX_LENGTH = 11;

function sanitizeIdInput(value: string) {
  return value.replace(NON_DIGIT_PATTERN, '').slice(0, ID_MAX_LENGTH);
}

export function VerificationScreen() {
  const router = useRouter();
  const { access, profile, verifyIdentity } = useVerification();
  const [bvnInput, setBvnInput] = useState('');
  const [ninInput, setNinInput] = useState('');
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wasJustVerified, setWasJustVerified] = useState(false);

  const hasBothInputs = useMemo(
    () => bvnInput.length === ID_MAX_LENGTH && ninInput.length === ID_MAX_LENGTH,
    [bvnInput, ninInput]
  );

  useEffect(() => {
    if (!wasJustVerified) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace('/home' as never);
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [router, wasJustVerified]);

  async function handleSubmit() {
    setIsSubmitting(true);
    const result = await verifyIdentity({
      bvn: bvnInput,
      nin: ninInput,
    });

    setNotice({
      tone: result.success ? 'success' : 'error',
      message: result.message,
    });

    if (result.success) {
      setWasJustVerified(true);
    }

    setIsSubmitting(false);
  }

  const headerSubtitle = access.isVerified
    ? 'Your profile is fully verified.'
    : access.needsProfileCompletion
      ? 'Complete your profile before identity verification.'
      : 'BVN and NIN are required to unlock full access.';

  return (
    <AppScreen keyboardAware withTabBarOffset={false}>
      <View style={styles.screen}>
        <PremiumScreenHeader
          centered={false}
          onBackPress={() => router.back()}
          subtitle={headerSubtitle}
          title="Verification"
          titleSize="display"
        />

        <VerificationProgressCard profile={profile} />

        {access.needsProfileCompletion ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Complete profile first</Text>
            <Text style={styles.formDescription}>
              Add your date of birth, address, and nationality before submitting BVN and NIN.
            </Text>
            <AppButton
              onPress={() => router.push('/complete-profile' as never)}
              title="Continue profile setup"
            />
          </View>
        ) : !access.isVerified ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Complete BVN and NIN verification</Text>
            <Text style={styles.formDescription}>
              This keeps your account compliant and unlocks payments, funding, cards, and transfers.
            </Text>

            <AppInput
              keyboardType="number-pad"
              label="BVN"
              maxLength={ID_MAX_LENGTH}
              onChangeText={(value) => setBvnInput(sanitizeIdInput(value))}
              placeholder="Enter 11-digit BVN"
              value={bvnInput}
            />

            <AppInput
              keyboardType="number-pad"
              label="NIN"
              maxLength={ID_MAX_LENGTH}
              onChangeText={(value) => setNinInput(sanitizeIdInput(value))}
              placeholder="Enter 11-digit NIN"
              value={ninInput}
            />

            {notice ? <NoticeBanner message={notice.message} tone={notice.tone} /> : null}

            <AppButton
              disabled={!hasBothInputs || isSubmitting}
              loading={isSubmitting}
              onPress={handleSubmit}
              title="Continue"
            />
          </View>
        ) : (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Feather color={Colors.background} name="check" size={20} />
            </View>
            <Text style={styles.successTitle}>Verification complete</Text>
            <Text style={styles.successBody}>
              Full access has been unlocked. You can now add money, move funds, create cards, and send payments.
            </Text>
            <AppButton onPress={() => router.replace('/home' as never)} title="Back to Home" />
          </View>
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  formTitle: {
    color: Colors.text,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.cardTitle.lineHeight,
  },
  formDescription: {
    color: Colors.textMuted,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  successCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: 'rgba(31, 168, 154, 0.18)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  successTitle: {
    color: Colors.text,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.cardTitle.lineHeight,
  },
  successBody: {
    color: Colors.textMuted,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
});
