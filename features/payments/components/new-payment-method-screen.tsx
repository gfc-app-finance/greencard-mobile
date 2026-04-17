import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { PremiumScreenHeader } from '@/features/home/components/premium-screen-header';
import { LockedFeatureState } from '@/features/verification/components/locked-feature-state';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';
import { paymentMethodOptions } from '@/services/payments-service';

import { usePaymentFlow } from '../providers/payment-flow-provider';
import { PaymentMethodSelector } from './payment-method-selector';

export function NewPaymentMethodScreen() {
  const router = useRouter();
  const { access, profile } = useVerification();
  const { startDraft } = usePaymentFlow();

  const handleSelect = (type: 'bank' | 'international') => {
    startDraft(type);
    router.push(type === 'bank' ? '/payments/bank' : '/payments/international');
  };

  if (!access.canSendPayment) {
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
        <View style={styles.topArea}>
          <PremiumScreenHeader
            onBackPress={() => router.back()}
            subtitle="Choose how you want to send money."
            title="New payment"
            titleSize="display"
          />

          <PaymentMethodSelector onSelect={handleSelect} options={paymentMethodOptions} />
        </View>

        <AppCard style={styles.tipCard}>
          <Text style={styles.tipTitle}>Built for high-trust payments</Text>
          <Text style={styles.tipBody}>
            Every route ends with a review step and tracker so the user can confirm details before
            the payment is submitted.
          </Text>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.lg,
  },
  topArea: {
    gap: Spacing.lg,
  },
  tipCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  tipTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  tipBody: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
