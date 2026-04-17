import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { HomeToolbar } from '@/features/home/components/home-toolbar';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { GlobalSearchSheet } from '@/features/search/components/global-search-sheet';
import { VerificationBannerCard } from '@/features/verification/components/verification-banner-card';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';
import type { PaymentListFilter } from '@/types/payments';

import { usePaymentFlow } from '../providers/payment-flow-provider';
import { PaymentFilterChips } from './payment-filter-chips';
import { RecentPaymentListItem } from './recent-payment-list-item';

export function PaymentsHomeScreen() {
  const router = useRouter();
  const { recentPayments } = usePaymentFlow();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, guardFeatureAction, profile } = useVerification();
  const [filter, setFilter] = useState<PaymentListFilter>('all');
  const [isQuickSearchVisible, setIsQuickSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredPayments = useMemo(
    () =>
      recentPayments.filter((payment) => (filter === 'all' ? true : payment.type === filter)),
    [filter, recentPayments]
  );

  if (isLoading || !dashboard) {
    return (
      <AppScreen contentContainerStyle={styles.loadingContent}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primaryStrong} size="large" />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <HomeToolbar
        avatarInitials={dashboard.avatarInitials}
        actions={[
          {
            id: 'new-payment',
            accent: true,
            iconName: 'plus',
            onPress: () =>
              guardFeatureAction('send_payment', () =>
                router.push('/payments/new' as never)
              ),
          },
        ]}
        onAvatarPress={() => router.push('/profile' as never)}
        onSearchChange={setSearchValue}
        onSearchPress={() => setIsQuickSearchVisible(true)}
        searchPlaceholder=""
        searchValue={searchValue}
      />

      {!access.canSendPayment ? (
        <VerificationBannerCard
          onVerifyPress={() =>
            router.push(getVerificationJourneyRoute(profile) as never)
          }
          profile={profile}
        />
      ) : null}

      <PaymentFilterChips onChange={setFilter} value={filter} />

      <View style={styles.list}>
        {filteredPayments.map((payment) => (
          <RecentPaymentListItem
            key={payment.id}
            onPress={() =>
              router.push({
                pathname: '/payments/success',
                params: { paymentId: payment.id },
              } as never)
            }
            payment={payment}
          />
        ))}

        {!filteredPayments.length ? (
          <AppCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No payments in this filter yet.</Text>
            <Text style={styles.emptyDescription}>
              Start a new payment from the + button and it will appear here for tracking.
            </Text>
          </AppCard>
        ) : null}
      </View>

      <GlobalSearchSheet
        onClose={() => {
          setIsQuickSearchVisible(false);
          setSearchValue('');
        }}
        onSearchValueChange={setSearchValue}
        searchValue={searchValue}
        visible={isQuickSearchVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: Spacing.lg,
  },
  loadingContent: {
    justifyContent: 'center',
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
  },
  list: {
    gap: Spacing.md,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
  emptyDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
