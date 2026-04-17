import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { SupportTicketDetail } from '@/features/support/components/support-ticket-detail';
import { useSupportTicketQuery } from '@/features/support/hooks/use-support-query';

export default function SupportTicketDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticketId?: string | string[] }>();
  const ticketId = Array.isArray(params.ticketId) ? params.ticketId[0] : params.ticketId;
  const ticketQuery = useSupportTicketQuery(ticketId ?? null);

  if (ticketQuery.isLoading) {
    return (
      <AppScreen contentContainerStyle={styles.loadingContent}>
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.primaryStrong} size="large" />
        </View>
      </AppScreen>
    );
  }

  if (!ticketQuery.data) {
    return (
      <AppScreen>
        <AppCard style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Ticket not found</Text>
          <Text style={styles.emptyDescription}>
            This support thread is not available in the current mock dataset yet.
          </Text>
          <AppButton
            title="Back to Support"
            onPress={() => router.replace('/support')}
            variant="secondary"
          />
        </AppCard>
      </AppScreen>
    );
  }

  return <SupportTicketDetail ticket={ticketQuery.data} />;
}

const styles = StyleSheet.create({
  loadingContent: {
    justifyContent: 'center',
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 360,
  },
  emptyCard: {
    gap: Spacing.md,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  emptyDescription: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
