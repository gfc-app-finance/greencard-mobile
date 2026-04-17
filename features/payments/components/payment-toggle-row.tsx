import { StyleSheet, Switch, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type PaymentToggleRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (nextValue: boolean) => void;
};

export function PaymentToggleRow({
  title,
  description,
  value,
  onValueChange,
}: PaymentToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Switch
        onValueChange={onValueChange}
        thumbColor={Colors.white}
        trackColor={{ false: 'rgba(166, 183, 190, 0.28)', true: Colors.primaryStrong }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
