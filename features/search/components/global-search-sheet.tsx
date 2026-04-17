import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { usePaymentFlow } from '@/features/payments/providers/payment-flow-provider';
import { useSupportSnapshotQuery } from '@/features/support/hooks/use-support-query';
import {
  formatActivityListTimestamp,
  getAccountStatusLabel,
  getFundingStatusLabel,
  getManagedCardStatusLabel,
  getTransferStatusLabel,
} from '@/services/goova-app-state-service';

import { GroupedSearchResultsSection } from './grouped-search-results-section';
import type { GlobalSearchResultItem, GlobalSearchSectionKey } from './search-types';

type GlobalSearchSheetProps = {
  visible: boolean;
  onClose: () => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
};

const sectionTitles: Record<GlobalSearchSectionKey, string> = {
  accounts: 'Accounts',
  transactions: 'Transactions',
  activity: 'Activity',
  recipients: 'Recipients',
  support: 'Support',
  cards: 'Cards',
  savings: 'Savings goals',
};

function normalizeSearchQuery(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function matchesSearch(result: GlobalSearchResultItem, query: string) {
  const haystack = [result.title, result.subtitle, result.meta, result.accentLabel]
    .filter(Boolean)
    .join(' ');

  const normalizedHaystack = normalizeSearchQuery(haystack);
  const queryTokens = query.split(' ').filter(Boolean);

  if (!queryTokens.length) {
    return true;
  }

  return queryTokens.every((token) => normalizedHaystack.includes(token));
}

export function GlobalSearchSheet({
  visible,
  onClose,
  searchValue,
  onSearchValueChange,
}: GlobalSearchSheetProps) {
  const router = useRouter();
  const supportQuery = useSupportSnapshotQuery();
  const { activities, accounts, cards, fundings, getPaymentById, payments, recipients, savingsGoals, transfers } =
    useGoovaAppState();
  const { seedDraftFromPayment } = usePaymentFlow();

  const closeAndReset = useCallback(() => {
    onClose();
  }, [onClose]);

  const resultsBySection = useMemo(() => {
    const accountResults: GlobalSearchResultItem[] = accounts.map((account) => ({
      id: account.id,
      sectionKey: 'accounts',
      title: account.displayName,
      subtitle: `${account.currencyLabel} - ${account.providerName}`,
      meta: `${account.currencyCode} account`,
      accentLabel: getAccountStatusLabel(account.status),
      onPress: () => {
        closeAndReset();
        router.push({
          pathname: '/account-details',
          params: { accountId: account.id },
        } as never);
      },
    }));

    const transactionResults: GlobalSearchResultItem[] = [
      ...payments.map((payment) => ({
        id: payment.id,
        sectionKey: 'transactions' as const,
        title: `Payment to ${payment.recipientName}`,
        subtitle: `${payment.displayAmount} - ${payment.destinationLabel}`,
        meta: payment.statusLabel,
        accentLabel: payment.typeLabel,
        onPress: () => {
          closeAndReset();
          router.push({
            pathname: '/payments/success',
            params: { paymentId: payment.id },
          } as never);
        },
      })),
      ...fundings.map((funding) => ({
        id: funding.id,
        sectionKey: 'transactions' as const,
        title: `Funding ${funding.currencyCode} account`,
        subtitle: funding.accountLabel,
        meta: getFundingStatusLabel(funding.status),
        accentLabel: 'Funding',
        onPress: () => {
          closeAndReset();
          router.push({
            pathname: '/activity/[activityId]',
            params: { activityId: `activity_${funding.id}` },
          } as never);
        },
      })),
      ...transfers.map((transfer) => ({
        id: transfer.id,
        sectionKey: 'transactions' as const,
        title: `Transfer ${transfer.sourceCurrencyCode} to ${transfer.destinationCurrencyCode}`,
        subtitle: `${transfer.sourceAccountLabel} to ${transfer.destinationAccountLabel}`,
        meta: getTransferStatusLabel(transfer.status),
        accentLabel: 'FX',
        onPress: () => {
          closeAndReset();
          router.push({
            pathname: '/activity/[activityId]',
            params: { activityId: `activity_${transfer.id}` },
          } as never);
        },
      })),
    ];

    const activityResults: GlobalSearchResultItem[] = activities.map((activity) => ({
        id: activity.id,
        sectionKey: 'activity' as const,
        title: activity.title,
        subtitle: activity.subtitle,
        meta: formatActivityListTimestamp(activity.createdAt),
        accentLabel: activity.statusLabel,
        onPress: () => {
          closeAndReset();
          router.push({
            pathname: '/activity/[activityId]',
            params: { activityId: activity.id },
          } as never);
        },
      }));

    const recipientResults: GlobalSearchResultItem[] = recipients.map((recipient) => ({
      id: recipient.id,
      sectionKey: 'recipients',
      title: recipient.name,
      subtitle: recipient.subtitle,
      meta: recipient.destinationLabel,
      accentLabel: 'Fast pay',
      onPress: () => {
        const payment = getPaymentById(recipient.paymentId);

        if (!payment) {
          return;
        }

        seedDraftFromPayment(payment);
        closeAndReset();
        router.push(payment.type === 'bank' ? '/payments/bank' : '/payments/international');
      },
    }));

    const supportResults: GlobalSearchResultItem[] = (supportQuery.data?.tickets || []).map((ticket) => ({
      id: ticket.id,
      sectionKey: 'support',
      title: ticket.title,
      subtitle: ticket.category,
      meta: ticket.updatedAt,
      accentLabel: ticket.statusLabel,
      onPress: () => {
        closeAndReset();
        router.push({
          pathname: '/support/[ticketId]',
          params: { ticketId: ticket.id },
        } as never);
      },
    }));

    const cardResults: GlobalSearchResultItem[] = cards.map((card) => ({
      id: card.id,
      sectionKey: 'cards',
      title: card.name,
      subtitle: `${card.type} ${card.network} ending ${card.last4}`,
      meta: `${card.fundingSourceLabel} - ${card.spendLimit}`,
      accentLabel: getManagedCardStatusLabel(card.status),
      onPress: () => {
        closeAndReset();
        router.push('/cards' as never);
      },
    }));

    const savingsResults: GlobalSearchResultItem[] = savingsGoals.map((goal) => ({
      id: goal.id,
      sectionKey: 'savings',
      title: goal.name,
      subtitle: `${goal.savedAmount} of ${goal.targetAmount}`,
      meta: goal.cadenceLabel,
      accentLabel: `${goal.progressPercentage}%`,
      onPress: () => {
        closeAndReset();
        router.push('/savings' as never);
      },
    }));

    return {
      accounts: accountResults,
      transactions: transactionResults,
      activity: activityResults,
      recipients: recipientResults,
      support: supportResults,
      cards: cardResults,
      savings: savingsResults,
      } satisfies Record<GlobalSearchSectionKey, GlobalSearchResultItem[]>;
  }, [
    accounts,
    activities,
    cards,
    fundings,
    getPaymentById,
    payments,
    recipients,
    router,
    savingsGoals,
    seedDraftFromPayment,
    supportQuery.data?.tickets,
    transfers,
    closeAndReset,
  ]);

  const filteredSections = useMemo(() => {
    const query = normalizeSearchQuery(searchValue);

    const sectionsWithMatches = (Object.keys(resultsBySection) as GlobalSearchSectionKey[]).map(
      (sectionKey) => ({
        key: sectionKey,
        title: sectionTitles[sectionKey],
        results: resultsBySection[sectionKey].filter((result) =>
          matchesSearch(result, query)
        ),
      })
    );

    const hasMatches = sectionsWithMatches.some((section) => section.results.length > 0);

    return sectionsWithMatches.map((section) => ({
      ...section,
      results:
        query.length && hasMatches
          ? section.results.slice(0, 6)
          : resultsBySection[section.key].slice(0, 4),
    }));
  }, [resultsBySection, searchValue]);

  return (
    <Modal animationType="fade" onRequestClose={closeAndReset} transparent visible={visible}>
      <Pressable onPress={closeAndReset} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.shell}>
          <AppCard style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Global search</Text>
                <Text style={styles.title}>Search GCF</Text>
                <Text style={styles.description}>
                  Find accounts, transactions, recipients, support tickets, cards, and savings goals.
                </Text>
              </View>

              <Pressable onPress={closeAndReset} style={styles.closeButton}>
                <Feather color={Colors.text} name="x" size={20} />
              </Pressable>
            </View>

            <View style={styles.searchInputWrap}>
              <Feather color={Colors.textMuted} name="search" size={18} />
              <TextInput
                autoFocus
                onChangeText={onSearchValueChange}
                placeholder="Search accounts, activity, recipients, support"
                placeholderTextColor={Colors.textSubtle}
                style={styles.searchInput}
                value={searchValue}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.resultStack}>
                {filteredSections.map((section) => (
                  <GroupedSearchResultsSection
                    key={section.key}
                    results={section.results}
                    title={section.title}
                  />
                ))}

                {!filteredSections.some((section) => section.results.length) ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptyDescription}>
                      Try another search term to explore accounts, transactions, or support history.
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.14)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  shell: {
    alignSelf: 'stretch',
    maxWidth: 560,
    width: '100%',
  },
  card: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
    maxHeight: '86%',
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
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
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 54,
  },
  resultStack: {
    gap: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
