import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { PaymentDestinationId, PaymentDestinationOption } from '@/types/payments';

type PaymentDestinationSelectorProps = {
  options: PaymentDestinationOption[];
  selectedId: PaymentDestinationId;
  onSelect: (destinationId: PaymentDestinationId) => void;
};

export function PaymentDestinationSelector({
  options,
  selectedId,
  onSelect,
}: PaymentDestinationSelectorProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {options.map((option) => {
          const isSelected = option.id === selectedId;

          return (
            <Pressable
              key={option.id}
              onPress={() => onSelect(option.id)}
              style={[styles.card, isSelected ? styles.cardSelected : null]}>
              <Text style={[styles.accentLabel, isSelected ? styles.accentLabelSelected : null]}>
                {option.accentLabel}
              </Text>
              <Text style={styles.title}>{option.label}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 4,
    padding: Spacing.md,
    width: 208,
  },
  cardSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.18)',
  },
  accentLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  accentLabelSelected: {
    color: Colors.primaryStrong,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
