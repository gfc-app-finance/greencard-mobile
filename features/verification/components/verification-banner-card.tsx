import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { VerificationProfile } from '@/types/verification';

type VerificationBannerCardProps = {
  profile: VerificationProfile;
  onVerifyPress: () => void;
};

function getStatusLabel(profile: VerificationProfile) {
  if (profile.status === 'verified') {
    return 'Verified';
  }

  if (profile.status === 'profile_completed') {
    return 'Profile completed';
  }

  return 'Basic access';
}

function getDescription(profile: VerificationProfile) {
  if (profile.status === 'profile_completed') {
    return 'Finish BVN and NIN verification to unlock regulated payments, funding, and card controls.';
  }

  if (profile.status === 'verified') {
    return 'All regulated features are unlocked and ready.';
  }

  return 'Complete profile and identity verification to unlock payments, funding, transfers, and full wallet controls.';
}

function getCtaLabel(profile: VerificationProfile) {
  if (profile.status === 'basic') {
    return 'Complete profile';
  }

  if (profile.status === 'profile_completed') {
    return 'Verify identity';
  }

  return 'View verification';
}

export function VerificationBannerCard({
  profile,
  onVerifyPress,
}: VerificationBannerCardProps) {
  const statusLabel = getStatusLabel(profile);
  const description = getDescription(profile);
  const ctaLabel = getCtaLabel(profile);

  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Feather color={Colors.primaryStrong} name="shield" size={20} />
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.title}>{statusLabel}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </View>

      <AppButton onPress={onVerifyPress} title={ctaLabel} />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copyWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
});
