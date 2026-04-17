import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { SupportMessageBubble } from '@/features/support/components/support-message-bubble';
import { SupportStatusBadge } from '@/features/support/components/support-status-badge';
import type { SupportTicket } from '@/types/support';

type SupportTicketDetailProps = {
  ticket: SupportTicket;
};

export function SupportTicketDetail({
  ticket,
}: SupportTicketDetailProps) {
  const router = useRouter();
  const [reply, setReply] = useState('');

  return (
    <AppScreen
      withTabBarOffset={false}
      scrollable={false}
      contentContainerStyle={styles.screenContent}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Feather color={Colors.text} name="arrow-left" size={18} />
            </Pressable>

            <SupportStatusBadge label={ticket.statusLabel} tone={ticket.statusTone} />
          </View>

          <Text style={styles.ticketId}>{ticket.id}</Text>
          <Text style={styles.title}>{ticket.title}</Text>
          <Text style={styles.description}>
            Keep the support conversation tied to the right transaction and resolve issues without leaving the money flow.
          </Text>
        </View>

        {ticket.linkedTransaction ? (
          <AppCard style={styles.transactionCard}>
            <Text style={styles.cardEyebrow}>Linked Transaction</Text>
            <Text style={styles.transactionTitle}>{ticket.linkedTransaction.title}</Text>
            <Text style={styles.transactionAmount}>{ticket.linkedTransaction.amount}</Text>

            <View style={styles.transactionMeta}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Account</Text>
                <Text style={styles.metaValue}>{ticket.linkedTransaction.accountLabel}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Status</Text>
                <Text style={styles.metaValue}>{ticket.linkedTransaction.statusLabel}</Text>
              </View>
            </View>

            <Text style={styles.transactionDate}>{ticket.linkedTransaction.date}</Text>
          </AppCard>
        ) : null}

        <View style={styles.threadCard}>
          <View style={styles.threadHeader}>
            <Text style={styles.threadTitle}>Conversation</Text>
            <Text style={styles.threadSubtitle}>{ticket.updatedAt}</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messagesList}>
            {ticket.messages.map((message) => (
              <SupportMessageBubble key={message.id} message={message} />
            ))}
          </ScrollView>
        </View>

        <View style={styles.footer}>
          <AppButton title="Mark as Resolved" variant="secondary" onPress={() => undefined} />

          <View style={styles.composer}>
            <TextInput
              onChangeText={setReply}
              placeholder="Add a message for support"
              placeholderTextColor={Colors.textSubtle}
              style={styles.composerInput}
              value={reply}
            />

            <Pressable
              accessibilityRole="button"
              onPress={() => undefined}
              style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}>
              <Feather color={Colors.background} name="send" size={16} />
            </Pressable>
          </View>
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
  },
  screen: {
    flex: 1,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.sm,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  ticketId: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  transactionCard: {
    gap: Spacing.sm,
  },
  cardEyebrow: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  transactionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  transactionAmount: {
    color: Colors.primaryStrong,
    fontSize: 20,
    fontWeight: '800',
  },
  transactionMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  transactionDate: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  threadCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    padding: Spacing.lg,
  },
  threadHeader: {
    marginBottom: Spacing.md,
  },
  threadTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  threadSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  messagesList: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  footer: {
    gap: Spacing.sm,
  },
  composer: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  composerInput: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 44,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  pressed: {
    opacity: 0.92,
  },
});
