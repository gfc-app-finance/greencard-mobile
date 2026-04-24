import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { AuthEntryShell } from '@/features/auth/components/auth-entry-shell';

type AuthShellProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description?: string;
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
        {description ? <Text style={styles.description}>{description}</Text> : null}
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
    height: 48,
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  hero: {
    marginTop: 0,
    gap: 2,
    marginBottom: 16,
  },
  eyebrow: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1,
    lineHeight: 40,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: 4,
  },
  body: {
    flex: 1,
    width: '100%',
    marginTop: 0,
  },
});
