import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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

const REDIRECT_DELAY_MS = 900;

export function CompleteProfileScreen() {
  const router = useRouter();
  const { access, completeProfile, profile } = useVerification();
  const [dateOfBirth, setDateOfBirth] = useState(profile.dateOfBirth);
  const [address, setAddress] = useState(profile.address);
  const [nationality, setNationality] = useState(profile.nationality);
  const [notice, setNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedNow, setCompletedNow] = useState(false);

  useEffect(() => {
    if (!completedNow) {
      return;
    }

    const timer = setTimeout(() => {
      router.replace('/verification' as never);
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [completedNow, router]);

  async function handleContinue() {
    setIsSubmitting(true);

    const result = await completeProfile({
      dateOfBirth,
      address,
      nationality,
    });

    setNotice({
      tone: result.success ? 'success' : 'error',
      message: result.message,
    });

    if (result.success) {
      setCompletedNow(true);
    }

    setIsSubmitting(false);
  }

  const hasCompletedProfile = !access.needsProfileCompletion;
  const subtitle = hasCompletedProfile
    ? 'Profile details are already completed.'
    : 'Add profile details first, then continue to identity verification.';

  return (
    <AppScreen keyboardAware withTabBarOffset={false}>
      <View style={styles.screen}>
        <PremiumScreenHeader
          centered={false}
          onBackPress={() => router.back()}
          subtitle={subtitle}
          title="Complete profile"
          titleSize="display"
        />

        <VerificationProgressCard profile={profile} />

        {hasCompletedProfile ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>
              {access.isVerified ? 'Profile complete' : 'Profile details saved'}
            </Text>
            <Text style={styles.successBody}>
              {access.isVerified
                ? 'Your account is fully verified and all features are unlocked.'
                : 'Continue to BVN and NIN verification to unlock regulated actions.'}
            </Text>
            <AppButton
              onPress={() =>
                router.replace(
                  (access.isVerified ? '/home' : '/verification') as never
                )
              }
              title={access.isVerified ? 'Back to Home' : 'Continue to identity verification'}
            />
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Personal details</Text>
            <Text style={styles.formDescription}>
              These details are required for compliance before we can verify your BVN and NIN.
            </Text>

            <AppInput
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
              label="Date of birth"
              onChangeText={setDateOfBirth}
              placeholder="YYYY-MM-DD"
              value={dateOfBirth}
            />

            <AppInput
              label="Residential address"
              multiline
              onChangeText={setAddress}
              placeholder="14 Broad Street, Lagos"
              value={address}
            />

            <AppInput
              autoCapitalize="words"
              label="Nationality"
              onChangeText={setNationality}
              placeholder="Nigerian"
              value={nationality}
            />

            {notice ? <NoticeBanner message={notice.message} tone={notice.tone} /> : null}

            <AppButton
              loading={isSubmitting}
              onPress={handleContinue}
              title="Continue to identity verification"
            />
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
    backgroundColor: Colors.surface,
    borderColor: 'rgba(31, 168, 154, 0.18)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
    padding: Spacing.lg,
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
  },
});
