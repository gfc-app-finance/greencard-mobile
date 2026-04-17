import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { AppStatusChip } from '@/components/ui/app-status-chip';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { PaymentTracker } from '@/features/payments/components/payment-tracker';
import { formatCurrencyAmount } from '@/lib/currency';
import {
  buildFundingTimeline,
  buildTransferTimeline,
  formatActivityListTimestamp,
  getActivityStatusTone,
  getManagedCardStatusLabel,
} from '@/services/goova-app-state-service';
import { downloadPaymentReceipt } from '@/services/payment-receipt-service';

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function ActivityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ activityId?: string | string[] }>();
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [receiptNotice, setReceiptNotice] = useState<{
    tone: 'success' | 'error';
    message: string;
  } | null>(null);
  const activityId = Array.isArray(params.activityId) ? params.activityId[0] : params.activityId;
  const { cards, fundings, getActivityById, getPaymentById, transfers } = useGoovaAppState();
  const activity = getActivityById(activityId);

  if (!activity) {
    return (
      <AppScreen withTabBarOffset={false}>
        <AppCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Activity not found</Text>
          <Text style={styles.emptyDescription}>
            This activity item is not available in the current state snapshot.
          </Text>
          <AppButton onPress={() => router.replace('/activity' as never)} title="Back to activity" />
        </AppCard>
      </AppScreen>
    );
  }

  const linkedPayment =
    activity.linkedEntityType === 'payment' ? getPaymentById(activity.linkedEntityId) : null;
  const linkedFunding =
    activity.linkedEntityType === 'funding'
      ? fundings.find((funding) => funding.id === activity.linkedEntityId) || null
      : null;
  const linkedTransfer =
    activity.linkedEntityType === 'transfer'
      ? transfers.find((transfer) => transfer.id === activity.linkedEntityId) || null
      : null;
  const linkedCard =
    activity.linkedEntityType === 'card'
      ? cards.find((card) => card.id === activity.linkedEntityId) || null
      : null;

  const amountLabel =
    activity.amount && activity.currencyCode
      ? formatCurrencyAmount(activity.currencyCode, activity.amount)
      : null;
  const timelineSteps =
    linkedPayment?.timeline ||
    (linkedFunding
      ? buildFundingTimeline(linkedFunding.status, linkedFunding.createdAt)
      : linkedTransfer
        ? buildTransferTimeline(linkedTransfer.status, linkedTransfer.createdAt)
        : null);
  const canDownloadReceipt = linkedPayment?.status === 'completed';
  const showSupportAction = linkedPayment?.status === 'failed';

  async function handleDownloadReceipt() {
    if (!linkedPayment) {
      return;
    }

    setIsDownloadingReceipt(true);
    const result = await downloadPaymentReceipt(linkedPayment);
    setReceiptNotice({
      tone: result.success ? 'success' : 'error',
      message: result.message,
    });
    setIsDownloadingReceipt(false);
  }

  return (
    <AppScreen withTabBarOffset={false}>
      <View style={styles.screen}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Feather color={Colors.text} name="x" size={22} />
        </Pressable>

        <AppCard style={styles.heroCard}>
          <Text style={styles.eyebrow}>{activity.type.toUpperCase()}</Text>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.subtitle}>{activity.description}</Text>

          <View style={styles.heroFooter}>
            <AppStatusChip label={activity.statusLabel} tone={getActivityStatusTone(activity.status)} />
            {amountLabel ? <Text style={styles.amountValue}>{amountLabel}</Text> : null}
          </View>
        </AppCard>

        <AppCard style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Details</Text>
          <DetailRow label="Summary" value={activity.subtitle} />
          <DetailRow label="Status" value={activity.statusLabel} />
          <DetailRow label="Created" value={formatActivityListTimestamp(activity.createdAt)} />

          {linkedPayment ? (
            <>
              <DetailRow label="Recipient" value={linkedPayment.recipientName} />
              <DetailRow label="Source account" value={linkedPayment.sourceAccountLabel} />
              <DetailRow label="Reference" value={linkedPayment.reference} />
            </>
          ) : null}

          {linkedFunding ? (
            <>
              <DetailRow label="Account" value={linkedFunding.accountLabel} />
              <DetailRow label="Funding source" value={linkedFunding.fundingSourceLabel} />
              <DetailRow label="Reference" value={linkedFunding.reference} />
            </>
          ) : null}

          {linkedTransfer ? (
            <>
              <DetailRow label="From" value={linkedTransfer.sourceAccountLabel} />
              <DetailRow label="To" value={linkedTransfer.destinationAccountLabel} />
              <DetailRow label="FX rate" value={linkedTransfer.rate.toFixed(4)} />
              <DetailRow label="Reference" value={linkedTransfer.reference} />
            </>
          ) : null}

          {linkedCard ? (
            <>
              <DetailRow label="Card" value={linkedCard.name} />
              <DetailRow label="Status" value={getManagedCardStatusLabel(linkedCard.status)} />
              <DetailRow label="Network" value={linkedCard.network} />
              <DetailRow label="Last four" value={linkedCard.last4} />
              <DetailRow label="Funding source" value={linkedCard.fundingSourceLabel} />
            </>
          ) : null}
        </AppCard>

        {timelineSteps ? (
          <AppCard style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Transfer timeline</Text>
            <PaymentTracker steps={timelineSteps} />
          </AppCard>
        ) : null}

        {canDownloadReceipt ? (
          <AppButton
            loading={isDownloadingReceipt}
            onPress={handleDownloadReceipt}
            title="Download receipt"
            variant="secondary"
          />
        ) : linkedPayment && !showSupportAction ? (
          <NoticeBanner
            message="Receipt is available only after this payment is completed."
            tone="info"
          />
        ) : null}

        {receiptNotice ? <NoticeBanner message={receiptNotice.message} tone={receiptNotice.tone} /> : null}

        {showSupportAction ? (
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

        {linkedCard ? <AppButton onPress={() => router.push('/cards' as never)} title="Open card" variant="secondary" /> : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.md,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  heroFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountValue: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  detailsCard: {
    gap: Spacing.sm,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  emptyCard: {
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  emptyDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
