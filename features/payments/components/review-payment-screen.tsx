import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { PremiumScreenHeader } from '@/features/home/components/premium-screen-header';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { LockedFeatureState } from '@/features/verification/components/locked-feature-state';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';
import {
  buildBankPaymentReviewModel,
  buildInternationalPaymentReviewModel,
  createPaymentRecordFromReview,
} from '@/services/payments-service';

import { usePaymentFlow } from '../providers/payment-flow-provider';
import { PaymentReviewSummaryCard } from './payment-review-summary-card';

export function ReviewPaymentScreen() {
  const router = useRouter();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, profile } = useVerification();
  const { completePayment, draft, resetDraft } = usePaymentFlow();

  const reviewModel = useMemo(() => {
    if (!dashboard || !draft.type) {
      return null;
    }

    if (draft.type === 'bank' && draft.bankValues) {
      return buildBankPaymentReviewModel(draft.bankValues, dashboard.accounts);
    }

    if (draft.type === 'international' && draft.internationalValues) {
      return buildInternationalPaymentReviewModel(draft.internationalValues, dashboard.accounts);
    }

    return null;
  }, [dashboard, draft.bankValues, draft.internationalValues, draft.type]);

  useEffect(() => {
    if (!isLoading && !reviewModel) {
      router.replace('/payments/new' as never);
    }
  }, [isLoading, reviewModel, router]);

  const handleConfirm = () => {
    if (!reviewModel) {
      return;
    }

    const payment = createPaymentRecordFromReview(reviewModel);
    completePayment(payment);
    resetDraft();
    router.replace({
      pathname: '/payments/success',
      params: { paymentId: payment.id },
    } as never);
  };

  if (isLoading || !dashboard || !reviewModel) {
    return (
      <AppScreen scrollable={false} withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Preparing payment review...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!access.canUseFullPaymentFlow) {
    return (
      <AppScreen withTabBarOffset={false}>
        <LockedFeatureState
          feature="send_payment"
          onBack={() => router.back()}
          onVerifyNow={() =>
            router.push(getVerificationJourneyRoute(profile) as never)
          }
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen withTabBarOffset={false}>
      <View style={styles.screen}>
        <PremiumScreenHeader
          onBackPress={() => router.back()}
          subtitle="Check every detail before you submit this payment."
          title="Review payment"
        />

        <NoticeBanner
          message="The payment will be created after confirmation and tracked from the Payments tab."
          tone="info"
        />

        <PaymentReviewSummaryCard
          amount={reviewModel.amountDisplay}
          rows={[
            { label: 'Payment type', value: reviewModel.typeLabel },
            { label: 'Destination', value: reviewModel.destinationLabel },
            { label: 'Fee', value: reviewModel.feeDisplay, accent: reviewModel.feeAmount === 0 },
            {
              label: 'FX rate',
              value: reviewModel.fxRateLabel || 'No FX required',
            },
            { label: 'Total payable', value: reviewModel.totalPayableDisplay },
            { label: 'Source account', value: reviewModel.sourceAccountLabel },
          ]}
          subtitle="A high-trust summary of the transfer, fees, and source account."
          title="Transfer summary"
        />

        <AppCard style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Recipient details</Text>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Recipient</Text>
            <Text style={styles.detailValue}>{reviewModel.recipientName}</Text>
          </View>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Bank</Text>
            <Text style={styles.detailValue}>{reviewModel.recipientBankName}</Text>
          </View>
          <View style={styles.detailGroup}>
            <Text style={styles.detailLabel}>Payment note</Text>
            <Text style={styles.detailValue}>{reviewModel.note}</Text>
          </View>
          <View style={styles.recipientMetaList}>
            {reviewModel.recipientDetails.map((item) => (
              <View key={item} style={styles.metaPill}>
                <Text style={styles.metaPillText}>{item}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <View style={styles.actions}>
          <AppButton onPress={() => router.back()} title="Edit payment" variant="ghost" />
          <AppButton onPress={handleConfirm} title="Confirm payment" />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.md,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  detailGroup: {
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
  recipientMetaList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaPill: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  metaPillText: {
    color: Colors.textMuted,
    fontSize: 12,
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
