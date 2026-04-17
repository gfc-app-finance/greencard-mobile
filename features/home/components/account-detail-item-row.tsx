import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import type { DashboardAccountDetailItem } from '@/types/dashboard';

type AccountDetailItemRowProps = {
  item: DashboardAccountDetailItem;
  onCopyPress: (item: DashboardAccountDetailItem) => void;
};

export function AccountDetailItemRow({
  item,
  onCopyPress,
}: AccountDetailItemRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copyBlock}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.value}>{item.value}</Text>
        {item.helperText ? <Text style={styles.helper}>{item.helperText}</Text> : null}
      </View>

      <Pressable onPress={() => onCopyPress(item)} style={styles.copyButton}>
        <Feather color={Colors.primaryStrong} name="copy" size={20} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  copyBlock: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.62)',
    fontSize: 14,
  },
  value: {
    color: '#8AB4FF',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  helper: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  copyButton: {
    paddingTop: 22,
  },
});
