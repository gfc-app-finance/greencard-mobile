import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { HomeToolbar } from '@/features/home/components/home-toolbar';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { GlobalSearchSheet } from '@/features/search/components/global-search-sheet';
import { VerificationBannerCard } from '@/features/verification/components/verification-banner-card';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';

import { AccountListCard } from './account-list-card';

export function AccountsOverviewScreen() {
  const router = useRouter();
  const { createVirtualAccount } = useGoovaAppState();
  const { dashboard } = useHomeDashboard();
  const { access, guardFeatureAction, profile } = useVerification();
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [accountNotice, setAccountNotice] = useState<string | null>(null);

  const handleCreateAccountPress = () => {
    setAccountNotice(null);

    guardFeatureAction('create_virtual_account', () => {
      const nextAccount = createVirtualAccount();
      setAccountNotice(
        `${nextAccount.currencyCode} virtual account created and added to your account hub.`
      );
    });
  };

  return (
    <AppScreen contentContainerStyle={styles.content}>
      <HomeToolbar
        avatarInitials={dashboard?.avatarInitials || 'GCF'}
        onAvatarPress={() => router.push('/profile' as never)}
        onSearchChange={setSearchValue}
        onSearchPress={() => setIsSearchVisible(true)}
        searchPlaceholder=""
        searchValue={searchValue}
      />

      {!access.canCreateAccount ? (
        <VerificationBannerCard
          onVerifyPress={() =>
            router.push(getVerificationJourneyRoute(profile) as never)
          }
          profile={profile}
        />
      ) : null}

      <AppButton
        onPress={handleCreateAccountPress}
        title="Create virtual account"
        variant="secondary"
      />

      {accountNotice ? <NoticeBanner message={accountNotice} tone="success" /> : null}

      <View style={styles.list}>
        {dashboard?.accounts.map((account) => (
          <AccountListCard
            key={account.id}
            account={account}
            onPress={() =>
              router.push({
                pathname: '/account-details',
                params: { accountId: account.id },
              } as never)
            }
          />
        ))}
      </View>

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
  content: {
    gap: Spacing.lg,
  },
  list: {
    gap: Spacing.md,
  },
});
