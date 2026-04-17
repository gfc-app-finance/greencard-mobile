import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type MoveMoneyAccountCardProps = {
  account: DashboardAccount;
  amountLabel: string;
  onPress: () => void;
};

export function MoveMoneyAccountCard({
  account,
  amountLabel,
  onPress,
}: MoveMoneyAccountCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.currencyRow}>
          <View style={[styles.currencyBadge, { backgroundColor: account.accentSoftColor }]}>
            <Text style={[styles.currencyBadgeText, { color: account.accentColor }]}>
              {account.currencyCode}
            </Text>
          </View>
          <View>
            <Text style={styles.currencyCode}>{account.currencyCode}</Text>
            <Text style={styles.balance}>{`Balance: ${account.balance}`}</Text>
          </View>
        </View>

        <View style={styles.trailingRow}>
          <CurrencyAmountText
            align="right"
            color={Colors.text}
            style={styles.amountLabel}
            value={amountLabel}
            variant="card"
          />
          <Feather color={Colors.textMuted} name="chevron-down" size={22} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  currencyRow: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  currencyBadge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  currencyBadgeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  currencyCode: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  balance: {
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  trailingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  amountLabel: {
    minHeight: 34,
  },
});
