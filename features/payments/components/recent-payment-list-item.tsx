import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { formatPaymentListDate } from '@/services/payments-service';
import type { PaymentRecord } from '@/types/payments';

import { PaymentStatusBadge } from './payment-status-badge';

type RecentPaymentListItemProps = {
  payment: PaymentRecord;
  onPress: () => void;
};

export function RecentPaymentListItem({ payment, onPress }: RecentPaymentListItemProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : null]}>
      <View style={[styles.avatar, { backgroundColor: payment.avatarColor }]}>
        <Text style={styles.avatarText}>{payment.avatarText}</Text>
      </View>

      <View style={styles.copyColumn}>
        <View style={styles.headerRow}>
          <View style={styles.nameBlock}>
            <Text numberOfLines={1} style={styles.recipientName}>
              {payment.recipientName}
            </Text>
            <Text numberOfLines={1} style={styles.recipientMeta}>
              {payment.typeLabel} - {payment.destinationLabel}
            </Text>
          </View>
          <Text style={styles.dateText}>{formatPaymentListDate(payment.createdAt)}</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.metaBlock}>
            <Text numberOfLines={1} style={styles.subtitle}>
              {payment.recipientBankName}
            </Text>
            <PaymentStatusBadge label={payment.statusLabel} status={payment.status} />
          </View>

          <View style={styles.amountWrap}>
            <CurrencyAmountText
              align="right"
              color={Colors.text}
              value={payment.displayAmount}
              variant="card"
            />
            <Text style={styles.amountCaption}>You sent</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.02,
    shadowRadius: 14,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    lineHeight: Typography.body.lineHeight,
  },
  copyColumn: {
    flex: 1,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  nameBlock: {
    flex: 1,
    gap: 3,
  },
  recipientName: {
    color: Colors.text,
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    lineHeight: Typography.bodyLarge.lineHeight,
  },
  recipientMeta: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
  dateText: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
    marginTop: 2,
  },
  bottomRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  metaBlock: {
    flex: 1,
    gap: Spacing.xs,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  amountWrap: {
    alignItems: 'flex-end',
    minWidth: 96,
  },
  amountCaption: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
    marginTop: 2,
  },
});
