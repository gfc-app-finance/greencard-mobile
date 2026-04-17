import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { formatCurrencyAmount } from '@/lib/currency';
import { formatActivityListTimestamp } from '@/services/goova-app-state-service';
import type { ManagedCard } from '@/types/fintech';

export type CardDetailMode = 'details' | 'limits' | 'settings';

type CardDetailPanelProps = {
  card: ManagedCard;
  mode: CardDetailMode;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function CardDetailPanel({ card, mode }: CardDetailPanelProps) {
  const remainingLimit = Math.max(
    card.spendLimitAmount - card.monthlySpentAmount,
    0
  );
  const usagePercentage = Math.min(
    100,
    (card.monthlySpentAmount / Math.max(card.spendLimitAmount, 1)) * 100
  );

  if (mode === 'limits') {
    return (
      <AppCard style={styles.card}>
        <Text style={styles.title}>Spending limits</Text>
        <Text style={styles.description}>
          Keep foreign card spend in check with one clear monthly limit.
        </Text>

        <View style={styles.limitGrid}>
          <DetailRow label="Monthly limit" value={card.spendLimit} />
          <DetailRow label="Spent this month" value={card.monthlySpentDisplay} />
          <DetailRow
            label="Remaining"
            value={formatCurrencyAmount(card.spendLimitCurrencyCode, remainingLimit)}
          />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${usagePercentage}%` }]} />
        </View>
      </AppCard>
    );
  }

  if (mode === 'settings') {
    return (
      <AppCard style={styles.card}>
        <Text style={styles.title}>Card settings</Text>
        <Text style={styles.description}>
          Simple controls for international online card usage.
        </Text>

        <View style={styles.settingsList}>
          <DetailRow
            label="Usage"
            value="International online payments only"
          />
          <DetailRow
            label="Funding logic"
            value="Auto-selects a supported foreign balance before checkout"
          />
          <DetailRow
            label="Security"
            value="Freeze instantly in GCF whenever you need to pause spend"
          />
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>Card details</Text>
      <Text style={styles.description}>
        Key information for the single GCF virtual card tied to your foreign
        spending experience.
      </Text>

      <View style={styles.settingsList}>
        <DetailRow label="Card type" value={`${card.type} ${card.network}`} />
        <DetailRow label="Card number" value={`•••• ${card.last4}`} />
        <DetailRow label="Primary funding source" value={card.fundingSourceLabel} />
        <DetailRow label="Supported balances" value={card.linkedBalanceLabel} />
        <DetailRow
          label="Created"
          value={formatActivityListTimestamp(card.createdAt)}
        />
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  limitGrid: {
    gap: Spacing.sm,
  },
  settingsList: {
    gap: Spacing.sm,
  },
  detailRow: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.md,
  },
  detailLabel: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
  },
  detailValue: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  progressTrack: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 12,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    height: '100%',
  },
});
