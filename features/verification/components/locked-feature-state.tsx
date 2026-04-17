import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { getRestrictedFeatureCopy } from '@/features/verification/verification-access';
import type { RestrictedFeature } from '@/types/verification';

type LockedFeatureStateProps = {
  feature: RestrictedFeature;
  onVerifyNow: () => void;
  onBack?: () => void;
};

export function LockedFeatureState({
  feature,
  onVerifyNow,
  onBack,
}: LockedFeatureStateProps) {
  const copy = getRestrictedFeatureCopy(feature);

  return (
    <AppCard style={styles.card}>
      <View style={styles.iconWrap}>
        <Feather color={Colors.white} name="lock" size={24} />
      </View>

      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.description}>{copy.description}</Text>

      <View style={styles.actions}>
        {onBack ? <AppButton onPress={onBack} title="Go back" variant="ghost" /> : null}
        <AppButton onPress={onVerifyNow} title={copy.ctaLabel} />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: 'rgba(31, 168, 154, 0.16)',
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  actions: {
    gap: Spacing.sm,
  },
});
