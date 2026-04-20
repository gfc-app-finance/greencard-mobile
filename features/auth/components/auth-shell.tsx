import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { AuthEntryShell } from '@/features/auth/components/auth-entry-shell';

type AuthShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  headerLeft?: ReactNode;
}>;

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  headerLeft,
}: AuthShellProps) {
  return (
    <AuthEntryShell contentContainerStyle={styles.contentOverride} keyboardAware>
      <View style={styles.headerRow}>{headerLeft && <View>{headerLeft}</View>}</View>

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
  contentOverride: {
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  headerRow: {
    height: 56,
    justifyContent: 'center',
    marginBottom: 8,
  },
  hero: {
    gap: 6,
    marginBottom: 24,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 300,
  },
  body: {
    flex: 1,
    width: '100%',
  },
});
