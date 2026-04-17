import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { AppActivityType } from '@/types/fintech';

export type ActivityFilterValue = 'all' | AppActivityType;

type ActivityFilterChipsProps = {
  value: ActivityFilterValue;
  onChange: (value: ActivityFilterValue) => void;
};

const filterOptions: { id: ActivityFilterValue; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'funding', label: 'Funding' },
  { id: 'payment', label: 'Payments' },
  { id: 'transfer', label: 'Transfers' },
  { id: 'account', label: 'Accounts' },
  { id: 'card', label: 'Cards' },
];

export function ActivityFilterChips({ value, onChange }: ActivityFilterChipsProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.row}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}>
      {filterOptions.map((option) => {
        const isActive = option.id === value;

        return (
          <Pressable
            key={option.id}
            onPress={() => onChange(option.id)}
            style={[styles.chip, isActive ? styles.chipActive : null]}>
            <Text style={[styles.chipLabel, isActive ? styles.chipLabelActive : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
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
    paddingRight: Spacing.md,
  },
  chip: {
    alignSelf: 'flex-start',
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
  chipLabel: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    fontWeight: '600',
    lineHeight: Typography.secondary.lineHeight,
  },
  chipLabelActive: {
    color: Colors.primaryStrong,
  },
});
