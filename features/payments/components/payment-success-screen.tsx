import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { downloadPaymentReceipt } from '@/services/payment-receipt-service';
import { formatPaymentSuccessDate } from '@/services/payments-service';

import { usePaymentFlow } from '../providers/payment-flow-provider';
import { PaymentStatusBadge } from './payment-status-badge';
import { PaymentTracker } from './payment-tracker';

export function PaymentSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ paymentId?: string }>();
  const { getPaymentById, lastSubmittedPayment, resetDraft } = usePaymentFlow();
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [receiptNotice, setReceiptNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const payment = getPaymentById(params.paymentId) || lastSubmittedPayment;
  const isFailed = payment?.status === 'failed';
  const canDownloadReceipt = payment?.status === 'completed';

  if (!payment) {
    return (
      <AppScreen scrollable={false} withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading payment tracking details...</Text>
        </View>
      </AppScreen>
    );
  }

  async function handleDownloadReceipt() {
    if (!payment) {
      return;
    }

    setIsDownloadingReceipt(true);
    const result = await downloadPaymentReceipt(payment);
    setReceiptNotice({
      tone: result.success ? 'success' : 'error',
      message: result.message,
    });
    setIsDownloadingReceipt(false);
  }

  return (
    <AppScreen withTabBarOffset={false}>
      <View style={styles.screen}>
        <AppCard style={styles.heroCard}>
          <View style={[styles.successIcon, isFailed ? styles.failedIcon : null]}>
            <Feather color={Colors.white} name={isFailed ? 'x' : 'check'} size={24} />
          </View>
          <Text style={styles.successTitle}>
            {isFailed ? 'Payment failed' : 'Payment created successfully'}
          </Text>
          <Text style={styles.successBody}>
            {isFailed
              ? `This transfer to ${payment.recipientName} did not complete. Contact support to resolve it quickly.`
              : `${payment.recipientName} will see updates as this transfer moves through the settlement timeline.`}
          </Text>

          <View style={styles.amountBlock}>
            <CurrencyAmountText
              align="center"
              color={Colors.text}
              value={payment.displayAmount}
              variant="overview"
            />
            <Text style={styles.amountCaption}>{payment.recipientName}</Text>
          </View>

          <PaymentStatusBadge label={payment.statusLabel} status={payment.status} />
        </AppCard>

        <AppCard style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Payment details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>{payment.recipientName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Source account</Text>
            <Text style={styles.detailValue}>{payment.sourceAccountLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date / time</Text>
            <Text style={styles.detailValue}>{formatPaymentSuccessDate(payment.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Reference</Text>
            <Text style={styles.detailValue}>{payment.reference}</Text>
          </View>
        </AppCard>

        <AppCard style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Transfer timeline</Text>
          <PaymentTracker steps={payment.timeline} />
        </AppCard>

        {isFailed ? (
          <AppButton
            onPress={() =>
              router.push({
                pathname: '/support/[ticketId]',
                params: { ticketId: 'TKT-1988' },
              } as never)
            }
            title="Contact support"
          />
        ) : null}

        {canDownloadReceipt ? (
          <AppButton
            loading={isDownloadingReceipt}
            onPress={handleDownloadReceipt}
            title="Download receipt"
            variant="secondary"
          />
        ) : !isFailed ? (
          <NoticeBanner
            message="Receipt will be available when this transaction reaches Completed."
            tone="info"
          />
        ) : null}

        {receiptNotice ? <NoticeBanner message={receiptNotice.message} tone={receiptNotice.tone} /> : null}

        <View style={styles.actions}>
          <AppButton
            onPress={() => {
              resetDraft();
              router.replace('/payments' as never);
            }}
            title="Back to payments"
            variant="ghost"
          />
          <AppButton
            onPress={() => {
              resetDraft();
              router.replace('/payments/new' as never);
            }}
            title="New payment"
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.md,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  failedIcon: {
    backgroundColor: Colors.danger,
  },
  successTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  successBody: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  amountBlock: {
    alignItems: 'center',
    gap: 4,
    marginVertical: Spacing.xs,
  },
  amountCaption: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
});
