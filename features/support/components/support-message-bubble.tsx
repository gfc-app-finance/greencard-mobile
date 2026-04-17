import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { SupportMessage } from '@/types/support';

type SupportMessageBubbleProps = {
  message: SupportMessage;
};

export function SupportMessageBubble({
  message,
}: SupportMessageBubbleProps) {
  const isUserMessage = message.sender === 'user';

  return (
    <View
      style={[
        styles.wrapper,
        isUserMessage ? styles.userWrapper : styles.supportWrapper,
      ]}>
      <View
        style={[
          styles.bubble,
          isUserMessage ? styles.userBubble : styles.supportBubble,
        ]}>
        <Text style={styles.author}>{message.authorName}</Text>
        <Text style={styles.body}>{message.body}</Text>
        <Text style={styles.timestamp}>{message.timestamp}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  userWrapper: {
    alignItems: 'flex-end',
  },
  supportWrapper: {
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: Radius.xl,
    gap: 6,
    maxWidth: '88%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  supportBubble: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  userBubble: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.14)',
    borderWidth: 1,
  },
  author: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
});
