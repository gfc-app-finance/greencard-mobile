import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Typography } from '@/constants/theme';
import type { DashboardQuickAction } from '@/types/dashboard';

type AccountActionButtonProps = {
  action: DashboardQuickAction;
  locked?: boolean;
  onPress: () => void;
};

export function AccountActionButton({
  action,
  locked = false,
  onPress,
}: AccountActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed ? styles.buttonPressed : null]}>
      <View style={styles.iconShell}>
        <Feather color={action.accentColor} name={action.iconName} size={22} />
        {locked ? (
          <View style={styles.lockBadge}>
            <Feather color={Colors.primaryStrong} name="lock" size={10} />
          </View>
        ) : null}
      </View>
      <Text
        numberOfLines={2}
        style={[styles.label, locked ? styles.lockedLabel : null]}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
    minHeight: 94,
    paddingVertical: 4,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    width: 58,
  },
  lockBadge: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 17,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    top: 0,
    width: 17,
  },
  label: {
    color: Colors.text,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
    minHeight: 30,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  lockedLabel: {
    color: Colors.textMuted,
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
