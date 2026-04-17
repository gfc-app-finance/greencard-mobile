import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

type CardEmptyStateProps = {
  onCreate: () => void;
  showAction?: boolean;
  eyebrow?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
};

export function CardEmptyState({
  onCreate,
  showAction = true,
  eyebrow = 'ONE GCF CARD',
  title = 'Create your foreign virtual card',
  description = 'Greencard gives you one virtual card for international online payments, with clean controls, a spend limit, and support for your foreign balances.',
  actionLabel = 'Create your card',
}: CardEmptyStateProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.iconShell}>
        <Feather color={Colors.primaryStrong} name="credit-card" size={26} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {showAction ? <AppButton onPress={onCreate} title={actionLabel} /> : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    gap: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(15, 118, 110, 0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.xs,
    maxWidth: 320,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: Typography.micro.fontSize,
    fontWeight: '700',
    letterSpacing: Typography.micro.letterSpacing,
    lineHeight: Typography.micro.lineHeight,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.cardTitle.lineHeight,
    textAlign: 'center',
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    textAlign: 'center',
  },
});
