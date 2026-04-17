import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

type AuthSwitchRowProps = {
  prompt: string;
  actionLabel: string;
  onPress: () => void;
};

export function AuthSwitchRow({
  prompt,
  actionLabel,
  onPress,
}: AuthSwitchRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.prompt}>{prompt}</Text>
      <Pressable onPress={onPress}>
        <Text style={styles.action}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  prompt: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  action: {
    color: Colors.primaryStrong,
    fontSize: 14,
    fontWeight: '700',
  },
});
