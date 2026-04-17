import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { PaymentListFilter } from '@/types/payments';

type PaymentFilterChipsProps = {
  value: PaymentListFilter;
  onChange: (nextValue: PaymentListFilter) => void;
};

const filters: { id: PaymentListFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bank', label: 'Bank' },
  { id: 'international', label: 'International' },
];

export function PaymentFilterChips({ value, onChange }: PaymentFilterChipsProps) {
  return (
    <View style={styles.row}>
      {filters.map((filter) => {
        const isActive = filter.id === value;

        return (
          <Pressable
            key={filter.id}
            onPress={() => onChange(filter.id)}
            style={[styles.chip, isActive ? styles.chipActive : null]}>
            <Text style={[styles.label, isActive ? styles.labelActive : null]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.18)',
  },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    fontWeight: '600',
    lineHeight: Typography.secondary.lineHeight,
  },
  labelActive: {
    color: Colors.primaryStrong,
  },
});
