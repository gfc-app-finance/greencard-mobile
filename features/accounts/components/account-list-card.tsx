import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppStatusChip } from '@/components/ui/app-status-chip';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { getActivityStatusTone } from '@/services/goova-app-state-service';
import type { DashboardAccount } from '@/types/dashboard';

type AccountListCardProps = {
  account: DashboardAccount;
  onPress: () => void;
};

export function AccountListCard({ account, onPress }: AccountListCardProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={styles.eyebrow}>{account.currencyCode}</Text>
          <Text style={styles.title}>{account.displayName}</Text>
          <Text style={styles.subtitle}>{account.providerName}</Text>
        </View>

        <AppStatusChip label={account.statusLabel} tone={getActivityStatusTone(account.status)} />
      </View>

      <View style={styles.balanceWrap}>
        <CurrencyAmountText color={Colors.text} value={account.balance} variant="overview" />
        <Text style={styles.balanceCaption}>Available balance</Text>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>Account number</Text>
          <Text style={styles.metaValue}>{account.accountNumber}</Text>
        </View>
        <View style={styles.metaBlock}>
          <Text style={styles.metaLabel}>State</Text>
          <Text style={styles.metaValue}>{account.selectorHint}</Text>
        </View>
      </View>

      <Text style={styles.note}>{account.balanceNote}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.022,
    shadowRadius: 14,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: 4,
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
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    lineHeight: Typography.bodyLarge.lineHeight,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  balanceWrap: {
    gap: 4,
  },
  balanceCaption: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaBlock: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
  },
  metaValue: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  note: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
});
