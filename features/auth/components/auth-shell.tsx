import type { PropsWithChildren } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { AuthEntryShell } from '@/features/auth/components/auth-entry-shell';

type AuthShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
}>;

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <AuthEntryShell contentContainerStyle={styles.content} keyboardAware>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.body}>{children}</View>
    </AuthEntryShell>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  hero: {
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 420,
  },
  body: {
    alignSelf: 'center',
    gap: Spacing.md,
    maxWidth: 520,
    width: '100%',
  },
});
