import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({
  title,
  description,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const hasAction = Boolean(actionLabel && onActionPress);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title}>{title}</Text>
        {hasAction ? (
          <Pressable
            onPress={onActionPress}
            style={({ pressed }) => [styles.actionPressable, pressed && styles.pressed]}>
            <Text style={styles.actionLabel}>{actionLabel}</Text>
          </Pressable>
        ) : actionLabel ? (
          <Text style={styles.actionStatic}>{actionLabel}</Text>
        ) : null}
      </View>

      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.text,
    flex: 1,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  actionPressable: {
    paddingVertical: 2,
  },
  actionLabel: {
    color: Colors.primaryStrong,
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    lineHeight: Typography.meta.lineHeight,
  },
  actionStatic: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
  },
  pressed: {
    opacity: 0.88,
  },
});
