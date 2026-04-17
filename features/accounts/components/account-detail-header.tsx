import { StyleSheet, Text, View } from 'react-native';

import { AppStatusChip } from '@/components/ui/app-status-chip';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';
import { getActivityStatusTone } from '@/services/goova-app-state-service';
import type { DashboardAccount } from '@/types/dashboard';

type AccountDetailHeaderProps = {
  account: DashboardAccount;
};

export function AccountDetailHeader({ account }: AccountDetailHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{account.currencyCode}</Text>
          <Text style={styles.title}>{account.displayName}</Text>
          <Text style={styles.subtitle}>{account.providerName}</Text>
        </View>

        <AppStatusChip label={account.statusLabel} tone={getActivityStatusTone(account.status)} />
      </View>

      <View style={styles.balanceWrap}>
        <CurrencyAmountText color={Colors.text} value={account.balance} variant="hero" />
        <Text style={styles.caption}>Available balance</Text>
      </View>

      <Text style={styles.note}>{account.summaryNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: Spacing.md,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
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
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.cardTitle.lineHeight,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  balanceWrap: {
    gap: 4,
  },
  caption: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
  note: {
    color: Colors.textMuted,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
});
