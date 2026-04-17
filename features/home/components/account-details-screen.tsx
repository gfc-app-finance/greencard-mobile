import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { AccountDetailHeader } from '@/features/accounts/components/account-detail-header';
import { useVerification } from '@/hooks/use-verification';
import type { DashboardAccountDetailItem } from '@/types/dashboard';

import { getDashboardAccount, useHomeDashboard } from '../hooks/use-home-dashboard';
import { AccountDetailItemRow } from './account-detail-item-row';
import { AccountSelectorSheet } from './account-selector-sheet';
import { PremiumScreenHeader } from './premium-screen-header';

type ClipboardNavigator = {
  clipboard?: {
    writeText?: (text: string) => Promise<void>;
  };
};

export function AccountDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string }>();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, guardFeatureAction } = useVerification();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<'local' | 'international'>('local');
  const [isAccountSheetVisible, setIsAccountSheetVisible] = useState(false);

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const initialAccount = getDashboardAccount(dashboard.accounts, params.accountId);
    setSelectedAccountId(initialAccount.id);
  }, [dashboard, params.accountId]);

  if (isLoading || !dashboard || !selectedAccountId) {
    return (
      <AppScreen withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Preparing account details...</Text>
        </View>
      </AppScreen>
    );
  }

  const selectedAccount = getDashboardAccount(dashboard.accounts, selectedAccountId);
  const selectedSection =
    selectedAccount.detailsSections.find((section) => section.id === selectedSectionId) ||
    selectedAccount.detailsSections[0];
  const displayedSectionItems = access.canReceivePayment
    ? selectedSection.items
    : selectedSection.items.map((item) => ({
        ...item,
        value: 'Complete verification to unlock this detail',
      }));

  const handleCopyPress = async (item: DashboardAccountDetailItem) => {
    if (!access.canReceivePayment) {
      guardFeatureAction('receive_payment', () => undefined);
      return;
    }

    const navigatorClipboard = (
      globalThis as typeof globalThis & { navigator?: ClipboardNavigator }
    ).navigator?.clipboard;

    if (navigatorClipboard?.writeText) {
      await navigatorClipboard.writeText(item.value);
      Alert.alert('Copied', `${item.label} copied to your clipboard.`);
      return;
    }

    Alert.alert('Copy ready for native wiring', `${item.label} is ready to be copied.`);
  };

  return (
    <AppScreen withTabBarOffset={false}>
      <View style={styles.screen}>
        <PremiumScreenHeader
          centered={false}
          onBackPress={() => router.back()}
          title="Account details"
          titleSize="display"
        />

        <AccountDetailHeader account={selectedAccount} />

        {!access.canReceivePayment ? (
          <NoticeBanner
            message="Receiving details are limited on Basic access. Complete BVN and NIN verification to unlock full account details."
            tone="info"
          />
        ) : null}

        <AppButton
          containerStyle={styles.accountSelector}
          onPress={() => setIsAccountSheetVisible(true)}
          title={selectedAccount.currencyLabel}
          variant="secondary"
        />

        <View style={styles.segmentedControl}>
          {(['local', 'international'] as const).map((sectionId) => {
            const isActive = selectedSectionId === sectionId;

            return (
              <AppButton
                key={sectionId}
                containerStyle={[
                  styles.segmentButton,
                  isActive ? styles.segmentButtonActive : styles.segmentButtonInactive,
                ]}
                onPress={() => setSelectedSectionId(sectionId)}
                title={sectionId === 'local' ? 'Local' : 'International'}
                variant="secondary"
              />
            );
          })}
        </View>

        <AppCard style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{selectedSection.title}</Text>
          <Text style={styles.sectionDescription}>{selectedSection.description}</Text>

          <View style={styles.itemsList}>
            {displayedSectionItems.map((item) => (
              <AccountDetailItemRow
                key={item.id}
                item={item}
                onCopyPress={handleCopyPress}
              />
            ))}
          </View>

          <AppButton
            containerStyle={styles.shareButton}
            onPress={() =>
              guardFeatureAction('receive_payment', () => {
                Share.share({ message: selectedAccount.shareDetailsText });
              })
            }
            title={access.canReceivePayment ? 'Share details' : 'Unlock receiving details'}
            variant="secondary"
          />
        </AppCard>

        <AppCard style={styles.noteCard}>
          <View style={styles.noteRow}>
            <View style={styles.noteIcon}>
              <Feather color={Colors.white} name="shield" size={18} />
            </View>

            <Text style={styles.noteText}>{selectedAccount.safeguardingNote}</Text>
          </View>
        </AppCard>
      </View>

      <AccountSelectorSheet
        accounts={dashboard.accounts}
        onClose={() => setIsAccountSheetVisible(false)}
        onSelect={(accountId) => {
          setSelectedAccountId(accountId);
          setSelectedSectionId('local');
        }}
        selectedAccountId={selectedAccount.id}
        title="Choose account"
        visible={isAccountSheetVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.lg,
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
  accountSelector: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    minHeight: 50,
  },
  segmentedControl: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    padding: 4,
  },
  segmentButton: {
    borderRadius: Radius.full,
    flex: 1,
    minHeight: 48,
  },
  segmentButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderColor: 'transparent',
  },
  segmentButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  detailsCard: {
    backgroundColor: 'rgba(22, 22, 31, 0.96)',
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDescription: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  itemsList: {
    gap: 2,
  },
  shareButton: {
    marginTop: Spacing.sm,
  },
  noteCard: {
    backgroundColor: 'rgba(18, 21, 33, 0.98)',
  },
  noteRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  noteIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  noteText: {
    color: Colors.textMuted,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});
