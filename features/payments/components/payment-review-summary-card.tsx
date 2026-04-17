import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type PaymentReviewRow = {
  label: string;
  value: string;
  accent?: boolean;
};

type PaymentReviewSummaryCardProps = {
  title: string;
  subtitle: string;
  amount: string;
  rows: PaymentReviewRow[];
};

export function PaymentReviewSummaryCard({
  title,
  subtitle,
  amount,
  rows,
}: PaymentReviewSummaryCardProps) {
  return (
    <AppCard style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.amountWrap}>
        <CurrencyAmountText align="center" color={Colors.text} value={amount} variant="overview" />
      </View>

      <View style={styles.rowGroup}>
        {rows.map((row, index) => (
          <View
            key={`${row.label}-${index}`}
            style={[styles.row, index === rows.length - 1 ? styles.rowLast : null]}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={[styles.rowValue, row.accent ? styles.rowValueAccent : null]}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  amountWrap: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowGroup: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  rowValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  rowValueAccent: {
    color: Colors.success,
  },
});
