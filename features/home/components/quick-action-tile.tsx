import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardQuickAction } from '@/types/dashboard';

type QuickActionTileProps = {
  action: DashboardQuickAction;
  onPress?: () => void;
};

export function QuickActionTile({
  action,
  onPress,
}: QuickActionTileProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: `${action.accentColor}22` }]}>
        <Feather color={action.accentColor} name={action.iconName} size={20} />
      </View>

      <Text style={styles.label}>{action.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(13, 23, 38, 0.92)',
    borderColor: 'rgba(148, 163, 184, 0.12)',
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    minHeight: 112,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    width: '31.5%',
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.98 }],
  },
});
