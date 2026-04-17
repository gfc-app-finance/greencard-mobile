import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type AmountChipRowProps = {
  values: string[];
  onSelect: (value: string) => void;
};

export function AmountChipRow({ values, onSelect }: AmountChipRowProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}>
      {values.map((value) => (
        <Pressable key={value} onPress={() => onSelect(value)} style={styles.chip}>
          <Text style={styles.chipText}>{value}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
    paddingRight: Spacing.md,
  },
  chip: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  chipText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
  },
});
