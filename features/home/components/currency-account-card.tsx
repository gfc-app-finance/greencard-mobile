import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type CurrencyAccountCardProps = {
  account: DashboardAccount;
  isActive: boolean;
  onPress: () => void;
};

export function CurrencyAccountCard({
  account,
  isActive,
  onPress,
}: CurrencyAccountCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isActive ? Colors.surfaceAccent : Colors.surface,
          },
          isActive && {
            borderColor: account.accentColor,
            shadowOpacity: 0.08,
          },
        ]}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: account.accentSoftColor }]}>
            <Text style={[styles.badgeText, { color: account.accentColor }]}>
              {account.currencyCode}
            </Text>
          </View>

          {isActive ? (
            <View style={[styles.activeDot, { backgroundColor: account.accentColor }]} />
          ) : null}
        </View>

        <View style={styles.header}>
          <Text style={styles.label}>{account.currencyLabel}</Text>
          <Text style={[styles.changeLabel, { color: account.accentColor }]}>
            {account.changeLabel}
          </Text>
        </View>

        <CurrencyAmountText color={Colors.text} style={styles.balance} value={account.balance} />
        <Text style={styles.note}>{account.selectorHint}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    marginRight: Spacing.md,
  },
  card: {
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    minHeight: 168,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    width: 184,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    justifyContent: 'center',
    minWidth: 58,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  activeDot: {
    borderRadius: Radius.full,
    height: 10,
    width: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  header: {
    gap: 6,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  changeLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  balance: {
    minHeight: 34,
  },
  note: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.985 }],
  },
});
