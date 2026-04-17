import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { PaymentMethodOption, PaymentType } from '@/types/payments';

type PaymentMethodSelectorProps = {
  options: PaymentMethodOption[];
  onSelect: (paymentType: PaymentType) => void;
};

export function PaymentMethodSelector({ options, onSelect }: PaymentMethodSelectorProps) {
  return (
    <View style={styles.grid}>
      {options.map((option) => (
        <Pressable key={option.id} onPress={() => onSelect(option.id)} style={styles.pressable}>
          {({ pressed }) => (
            <AppCard style={[styles.card, pressed ? styles.cardPressed : null]}>
              <View style={styles.iconShell}>
                <Feather color={Colors.primaryStrong} name={option.iconName} size={22} />
              </View>
              <Text style={styles.accentLabel}>{option.accentLabel}</Text>
              <Text style={styles.title}>{option.title}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </AppCard>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'column',
    gap: Spacing.md,
  },
  pressable: {
    width: '100%',
  },
  card: {
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
    minHeight: 0,
  },
  cardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  accentLabel: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
