import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { TrendLineChart } from '@/features/analytics/components/trend-line-chart';
import type { DashboardAccount, DashboardAccountSpendInsight } from '@/types/dashboard';

type HomeAccountSpendCardProps = {
  account: DashboardAccount;
  insight: DashboardAccountSpendInsight | null;
};

export function HomeAccountSpendCard({
  account,
  insight,
}: HomeAccountSpendCardProps) {
  if (!insight) {
    return null;
  }

  const deltaTone =
    insight.monthlyDeltaDirection === 'up'
      ? Colors.danger
      : insight.monthlyDeltaDirection === 'down'
        ? Colors.success
        : Colors.textMuted;
  const movementCount = insight.outgoingPaymentsCount + insight.transferCount;

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>ACCOUNT SPEND</Text>
          <Text style={styles.title}>{`Spent from ${account.currencyCode} account`}</Text>
          <Text style={styles.subtitle}>
            Month-to-date outgoing payments and conversions from this balance.
          </Text>
        </View>

        <View style={styles.currencyPill}>
          <Text style={[styles.currencyPillText, { color: account.accentColor }]}>
            {account.currencyCode}
          </Text>
        </View>
      </View>

      <View style={styles.metricRow}>
        <View style={styles.metricCopy}>
          <CurrencyAmountText
            color={Colors.text}
            style={styles.amount}
            value={insight.totalSpentDisplay}
            variant="card"
          />
          <Text style={[styles.deltaText, { color: deltaTone }]}>
            {insight.monthlyDeltaDisplay} vs last month
          </Text>
        </View>

        <View style={styles.metaColumn}>
          <Text style={styles.metaLabel}>{movementCount} movements</Text>
          <Text style={styles.metaValue}>
            {`${insight.outgoingPaymentsCount} payments / ${insight.transferCount} FX`}
          </Text>
        </View>
      </View>

      <TrendLineChart
        chartBackgroundColor={Colors.surfaceSecondary}
        data={insight.trendSeries}
        gridColor="rgba(107, 114, 128, 0.12)"
        labels={insight.trendLabels}
        lastPointColor={Colors.text}
        lineColor={account.accentColor}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Colors.textSubtle,
    fontSize: Typography.micro.fontSize,
    fontWeight: '700',
    letterSpacing: Typography.micro.letterSpacing,
    lineHeight: Typography.micro.lineHeight,
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
  },
  currencyPill: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.full,
    minHeight: 34,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  currencyPillText: {
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    letterSpacing: 0.6,
    lineHeight: Typography.meta.lineHeight,
  },
  metricRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  metricCopy: {
    flex: 1,
    gap: 6,
  },
  amount: {
    minHeight: 30,
  },
  deltaText: {
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaLabel: {
    color: Colors.text,
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    lineHeight: Typography.meta.lineHeight,
  },
  metaValue: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
    textAlign: 'right',
  },
});

