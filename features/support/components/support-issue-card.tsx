import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { SupportQuickIssue } from '@/types/support';

type SupportIssueCardProps = {
  issue: SupportQuickIssue;
  onPress: () => void;
};

export function SupportIssueCard({
  issue,
  onPress,
}: SupportIssueCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: `${issue.accentColor}22` }]}>
        <Feather color={issue.accentColor} name={issue.iconName} size={18} />
      </View>
      <Text style={styles.title}>{issue.title}</Text>
      <Text style={styles.subtitle}>{issue.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(12, 22, 37, 0.92)',
    borderColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.sm,
    minHeight: 132,
    padding: Spacing.lg,
    width: '48%',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
});
