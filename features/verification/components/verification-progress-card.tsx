import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { hasCompletedProfileDetails } from '@/features/verification/verification-access';
import type { VerificationProfile } from '@/types/verification';

type VerificationProgressCardProps = {
  profile: VerificationProfile;
};

type ProgressItemProps = {
  label: string;
  completed: boolean;
  trailingValue: string;
};

function ProgressItem({ label, completed, trailingValue }: ProgressItemProps) {
  return (
    <View style={styles.progressItem}>
      <View
        style={[
          styles.dot,
          completed ? styles.dotCompleted : styles.dotPending,
        ]}>
        {completed ? <Feather color={Colors.background} name="check" size={12} /> : null}
      </View>
      <Text style={[styles.itemLabel, completed ? styles.itemLabelCompleted : null]}>
        {label}
      </Text>
      <Text style={styles.trailingValue}>{trailingValue}</Text>
    </View>
  );
}

function getStatusLabel(profile: VerificationProfile) {
  if (profile.status === 'verified') {
    return 'Fully verified';
  }

  if (profile.status === 'profile_completed') {
    return 'Profile completed';
  }

  return 'Basic access';
}

function formatMaskedLabel(value: string | null, fallback: string) {
  return value ? `****${value}` : fallback;
}

export function VerificationProgressCard({
  profile,
}: VerificationProgressCardProps) {
  const hasProfileDetails = hasCompletedProfileDetails(profile);

  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>Verification progress</Text>
      <Text style={styles.subtitle}>{getStatusLabel(profile)}</Text>

      <View style={styles.progressList}>
        <ProgressItem
          completed={hasProfileDetails}
          label="Profile details"
          trailingValue={hasProfileDetails ? 'Completed' : 'Pending'}
        />
        <ProgressItem
          completed={profile.hasBVN}
          label="BVN"
          trailingValue={formatMaskedLabel(profile.bvnLast4, 'Pending')}
        />
        <ProgressItem
          completed={profile.hasNIN}
          label="NIN"
          trailingValue={formatMaskedLabel(profile.ninLast4, 'Pending')}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
    marginBottom: Spacing.xs,
  },
  progressList: {
    gap: Spacing.sm,
  },
  progressItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  dotCompleted: {
    backgroundColor: Colors.success,
  },
  dotPending: {
    backgroundColor: 'rgba(166, 183, 190, 0.22)',
    borderColor: 'rgba(166, 183, 190, 0.3)',
    borderWidth: 1,
  },
  itemLabel: {
    color: Colors.textMuted,
    flex: 1,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  itemLabelCompleted: {
    color: Colors.text,
  },
  trailingValue: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    letterSpacing: Typography.meta.letterSpacing,
    lineHeight: Typography.meta.lineHeight,
  },
});
