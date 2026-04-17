import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppStatusChip } from '@/components/ui/app-status-chip';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { resolveManagedCardStatusLabel, resolveManagedCardStatusTone } from '@/features/cards/card-status';
import type { ManagedCard } from '@/types/fintech';

type ManagedVirtualCardProps = {
  card: ManagedCard;
};

export function ManagedVirtualCard({ card }: ManagedVirtualCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Virtual Card</Text>
          <Text style={styles.title}>{card.name}</Text>
        </View>

        <AppStatusChip
          label={resolveManagedCardStatusLabel(card.status)}
          tone={resolveManagedCardStatusTone(card.status)}
        />
      </View>

      <View style={styles.centerRow}>
        <View style={styles.numberBlock}>
          <Text style={styles.networkLabel}>{card.network}</Text>
          <Text style={styles.digits}>{`•••• ${card.last4}`}</Text>
        </View>

        <View style={styles.iconShell}>
          <Feather color={Colors.text} name="credit-card" size={20} />
        </View>
      </View>

      <Text style={styles.footerCopy}>{card.usageNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: 'rgba(23, 23, 23, 0.08)',
    borderRadius: 32,
    borderWidth: 1,
    gap: Spacing.xl,
    overflow: 'hidden',
    padding: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  topRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 2,
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
  },
  centerRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  numberBlock: {
    gap: Spacing.sm,
  },
  networkLabel: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    lineHeight: Typography.meta.lineHeight,
    textTransform: 'uppercase',
  },
  digits: {
    color: Colors.text,
    fontSize: 34,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 38,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  footerCopy: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
});
