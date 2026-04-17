import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { SupportStatusBadge } from '@/features/support/components/support-status-badge';
import type { SupportTicket } from '@/types/support';

type SupportTicketCardProps = {
  ticket: SupportTicket;
  onPress: () => void;
};

export function SupportTicketCard({
  ticket,
  onPress,
}: SupportTicketCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.ticketId}>{ticket.id}</Text>
          <Text style={styles.title}>{ticket.title}</Text>
        </View>
        <SupportStatusBadge label={ticket.statusLabel} tone={ticket.statusTone} />
      </View>

      <Text style={styles.preview}>{ticket.preview}</Text>

      <View style={styles.footer}>
        <Text style={styles.category}>{ticket.category}</Text>
        <Text style={styles.updatedAt}>{ticket.updatedAt}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(12, 22, 37, 0.94)',
    borderColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  ticketId: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  preview: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  category: {
    color: Colors.primaryStrong,
    fontSize: 13,
    fontWeight: '600',
  },
  updatedAt: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
});
