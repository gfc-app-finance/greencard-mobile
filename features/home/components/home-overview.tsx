import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { AccountCarousel } from '@/features/home/components/account-carousel';
import { HomeAccountSpendCard } from '@/features/home/components/home-account-spend-card';
import { HomeActivityPanel } from '@/features/home/components/home-activity-panel';
import { HomeCurrencyWatchlistCard } from '@/features/home/components/home-currency-watchlist-card';
import { HomeMoreMenu } from '@/features/home/components/home-more-menu';
import { HomeQuickActionsRow } from '@/features/home/components/home-quick-actions-row';
import { HomeToolbar } from '@/features/home/components/home-toolbar';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { GlobalSearchSheet } from '@/features/search/components/global-search-sheet';
import { VerificationBannerCard } from '@/features/verification/components/verification-banner-card';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';

export function HomeOverview() {
  const router = useRouter();
  const { dashboard, isLoading } = useHomeDashboard();
  const { activities } = useGoovaAppState();
  const { access, guardFeatureAction, profile } = useVerification();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const pushAccountRoute = (pathname: '/add-money' | '/move-money' | '/account-details') => {
    router.push({
      pathname: pathname as never,
      params: { accountId: activeAccount.id },
    } as never);
  };

  const pushTabRoute = (pathname: '/payments' | '/activity' | '/support') => {
    router.push(pathname as never);
  };

  const pushUtilityRoute = (pathname: '/cards' | '/analytics' | '/profile') => {
    router.push(pathname as never);
  };

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const defaultIndex = dashboard.accounts.findIndex(
      (account) => account.id === dashboard.defaultAccountId
    );

    if (defaultIndex >= 0) {
      setActiveIndex(defaultIndex);
    }
  }, [dashboard]);

  if (isLoading || !dashboard) {
    return (
      <AppScreen contentContainerStyle={styles.loadingContent}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primaryStrong} size="large" />
        </View>
      </AppScreen>
    );
  }

  const activeAccount = dashboard.accounts[activeIndex] || dashboard.accounts[0];

  if (!activeAccount) {
    return null;
  }

  const activeSpendInsight =
    dashboard.spendInsights?.find((item) => item.accountId === activeAccount.id) || null;
  const activeWatchlist =
    dashboard.currencyWatchlist
      ?.filter((item) => item.quoteCurrencyCode === activeAccount.currencyCode)
      .slice(0, 3) || [];

  const handleQuickActionPress = (actionId: string) => {
    if (actionId === 'add-money') {
      guardFeatureAction('add_money', () => pushAccountRoute('/add-money'));
      return;
    }

    if (actionId === 'move-money') {
      guardFeatureAction('move_money', () => pushAccountRoute('/move-money'));
      return;
    }

    if (actionId === 'details') {
      pushAccountRoute('/account-details');
      return;
    }

    setIsMoreMenuVisible(true);
  };

  const handleMoreActionPress = (actionId: string) => {
    if (actionId === 'converter') {
      guardFeatureAction('move_money', () => pushAccountRoute('/move-money'));
      return;
    }

    if (actionId === 'statement') {
      pushTabRoute('/activity');
      return;
    }

    if (actionId === 'add-products') {
      pushUtilityRoute('/cards');
    }
  };

  const lockedActionIds = [
    access.canAddMoney ? null : 'add-money',
    access.canMoveMoney ? null : 'move-money',
  ].filter((value): value is string => Boolean(value));

  return (
    <AppScreen>
      <View style={styles.screen}>
        <HomeToolbar
          avatarInitials={dashboard.avatarInitials}
          actions={[
            {
              id: 'analytics',
              iconName: 'pie-chart',
              onPress: () => pushUtilityRoute('/analytics'),
            },
            {
              id: 'cards',
              iconName: 'credit-card',
              onPress: () => pushUtilityRoute('/cards'),
            },
          ]}
          onAvatarPress={() => pushUtilityRoute('/profile')}
          onSearchChange={setSearchValue}
          onSearchPress={() => setIsSearchVisible(true)}
          searchPlaceholder="Search"
          searchValue={searchValue}
        />

        <AccountCarousel
          accounts={dashboard.accounts}
          activeIndex={activeIndex}
          onAccountsPress={() => router.push('/accounts' as never)}
          onIndexChange={setActiveIndex}
        />

        {!access.isVerified ? (
          <VerificationBannerCard
            onVerifyPress={() =>
              router.push(getVerificationJourneyRoute(profile) as never)
            }
            profile={profile}
          />
        ) : null}

        <HomeQuickActionsRow
          actions={dashboard.quickActions}
          lockedActionIds={lockedActionIds}
          onActionPress={handleQuickActionPress}
        />

        <HomeActivityPanel
          items={activities.slice(0, 3)}
          onItemPress={(itemId) =>
            router.push({
              pathname: '/activity/[activityId]',
              params: { activityId: itemId },
            } as never)
          }
          onSeeAll={() => pushTabRoute('/activity')}
        />

        <HomeAccountSpendCard account={activeAccount} insight={activeSpendInsight} />

        <HomeCurrencyWatchlistCard
          account={activeAccount}
          items={activeWatchlist}
          onOpenConverter={() =>
            guardFeatureAction('move_money', () => pushAccountRoute('/move-money'))
          }
        />
      </View>

      <HomeMoreMenu
        activeAccount={activeAccount}
        onActionPress={handleMoreActionPress}
        onClose={() => setIsMoreMenuVisible(false)}
        visible={isMoreMenuVisible}
      />

      <GlobalSearchSheet
        onClose={() => {
          setIsSearchVisible(false);
          setSearchValue('');
        }}
        onSearchValueChange={setSearchValue}
        searchValue={searchValue}
        visible={isSearchVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
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
});
