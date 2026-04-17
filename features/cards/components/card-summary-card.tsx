import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppStatusChip } from '@/components/ui/app-status-chip';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { resolveManagedCardStatusLabel, resolveManagedCardStatusTone } from '@/features/cards/card-status';
import type { ManagedCard } from '@/types/fintech';

type CardSummaryCardProps = {
  card: ManagedCard;
};

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export function CardSummaryCard({ card }: CardSummaryCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>CARD SUMMARY</Text>
          <Text style={styles.title}>One card for global online spend</Text>
          <Text style={styles.subtitle}>
            Keep international spend in one place with a single Greencard virtual
            card and restrained controls.
          </Text>
        </View>

        <AppStatusChip
          label={resolveManagedCardStatusLabel(card.status)}
          tone={resolveManagedCardStatusTone(card.status)}
        />
      </View>

      <View style={styles.metricsRow}>
        <SummaryMetric label="This month spent" value={card.monthlySpentDisplay} />
        <SummaryMetric label="Spend limit" value={card.spendLimit} />
      </View>

      <View style={styles.fundingRow}>
        <View style={styles.fundingBlock}>
          <Text style={styles.fundingLabel}>Primary funding source</Text>
          <Text style={styles.fundingValue}>{card.fundingSourceLabel}</Text>
        </View>

        <View style={styles.fundingBalanceBadge}>
          <Text style={styles.fundingBalanceText}>{card.fundingSourceBalanceDisplay}</Text>
        </View>
      </View>

      <Text style={styles.supportedBalances}>
        Supported balances: {card.linkedBalanceLabel}
      </Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
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
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    padding: Spacing.md,
  },
  metricLabel: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
  },
  metricValue: {
    color: Colors.text,
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    lineHeight: Typography.bodyLarge.lineHeight,
  },
  fundingRow: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundElevated,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  fundingBlock: {
    flex: 1,
    gap: 4,
  },
  fundingLabel: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
  },
  fundingValue: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  fundingBalanceBadge: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(15, 118, 110, 0.12)',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  fundingBalanceText: {
    color: Colors.primaryStrong,
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    lineHeight: Typography.meta.lineHeight,
  },
  supportedBalances: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
});
