import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';
import { HomeToolbar } from '@/features/home/components/home-toolbar';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { GlobalSearchSheet } from '@/features/search/components/global-search-sheet';
import { SupportIssueCard } from '@/features/support/components/support-issue-card';
import { SupportSearchBar } from '@/features/support/components/support-search-bar';
import { SupportTicketCard } from '@/features/support/components/support-ticket-card';
import { useSupportSnapshotQuery } from '@/features/support/hooks/use-support-query';

export function SupportOverview() {
  const router = useRouter();
  const { dashboard } = useHomeDashboard();
  const supportQuery = useSupportSnapshotQuery();
  const [searchValue, setSearchValue] = useState('');
  const [globalSearchValue, setGlobalSearchValue] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  if (supportQuery.isLoading || !supportQuery.data) {
    return (
      <AppScreen contentContainerStyle={styles.loadingContent}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primaryStrong} size="large" />
        </View>
      </AppScreen>
    );
  }

  const support = supportQuery.data;
  const filteredTickets = support.tickets.filter((ticket) => {
    const searchTerm = searchValue.trim().toLowerCase();

    if (!searchTerm) {
      return true;
    }

    const haystack = `${ticket.id} ${ticket.title} ${ticket.category} ${ticket.preview}`.toLowerCase();
    return haystack.includes(searchTerm);
  });

  function openTicket(ticketId: string | undefined) {
    if (!ticketId) {
      return;
    }

    router.push({
      pathname: '/support/[ticketId]',
      params: { ticketId },
    });
  }

  return (
    <AppScreen>
      <View style={styles.screen}>
        <HomeToolbar
          avatarInitials={dashboard?.avatarInitials || 'GCF'}
          onAvatarPress={() => router.push('/profile' as never)}
          onSearchChange={setGlobalSearchValue}
          onSearchPress={() => setIsSearchVisible(true)}
          searchPlaceholder=""
          searchValue={globalSearchValue}
        />

        <SupportSearchBar onChangeText={setSearchValue} value={searchValue} />

        <View style={styles.sectionBlock}>
          <SectionHeader actionLabel="Popular issues" title="Quick troubleshoot" />

          <View style={styles.issueGrid}>
            {support.quickIssues.map((issue) => (
              <SupportIssueCard
                key={issue.id}
                issue={issue}
                onPress={() => openTicket(issue.ticketId)}
              />
            ))}
          </View>
        </View>

        <AppCard style={styles.createTicketCard}>
          <Text style={styles.createTicketEyebrow}>{support.createTicketTitle}</Text>
          <Text style={styles.createTicketTitle}>Talk to Greencard operations</Text>
          <Text style={styles.createTicketDescription}>
            {support.createTicketDescription}
          </Text>
          <AppButton title="Create Ticket" onPress={() => undefined} />
        </AppCard>

        <View style={styles.sectionBlock}>
          <SectionHeader
            actionLabel="View past tickets"
            onActionPress={() => undefined}
            title="Past tickets"
          />

          {filteredTickets.length > 0 ? (
            <View style={styles.ticketList}>
              {filteredTickets.map((ticket) => (
                <SupportTicketCard
                  key={ticket.id}
                  onPress={() => openTicket(ticket.id)}
                  ticket={ticket}
                />
              ))}
            </View>
          ) : (
            <AppCard style={styles.emptySearchCard}>
              <Text style={styles.emptySearchTitle}>No matching tickets</Text>
              <Text style={styles.emptySearchDescription}>
                Try a different search term or open one of the quick troubleshoot topics above.
              </Text>
            </AppCard>
          )}
        </View>
      </View>

      <GlobalSearchSheet
        onClose={() => {
          setIsSearchVisible(false);
          setGlobalSearchValue('');
        }}
        onSearchValueChange={setGlobalSearchValue}
        searchValue={globalSearchValue}
        visible={isSearchVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.lg,
  },
  sectionBlock: {
    gap: Spacing.sm,
  },
  issueGrid: {
    columnGap: Spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: Spacing.sm,
  },
  createTicketCard: {
    gap: Spacing.sm,
  },
  createTicketEyebrow: {
    color: Colors.primaryStrong,
    fontSize: Typography.micro.fontSize,
    fontWeight: '700',
    letterSpacing: Typography.micro.letterSpacing,
    lineHeight: Typography.micro.lineHeight,
  },
  createTicketTitle: {
    color: Colors.text,
    fontSize: Typography.cardTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.cardTitle.lineHeight,
  },
  createTicketDescription: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  ticketList: {
    gap: Spacing.md,
  },
  emptySearchCard: {
    gap: Spacing.sm,
  },
  emptySearchTitle: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  emptySearchDescription: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
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
