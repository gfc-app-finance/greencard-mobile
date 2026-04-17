import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type HomeBalanceCardProps = {
  isBalanceVisible: boolean;
  selectedAccount: DashboardAccount;
  onToggleBalance: () => void;
};

export function HomeBalanceCard({
  isBalanceVisible,
  selectedAccount,
  onToggleBalance,
}: HomeBalanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.balanceHeader}>
        <Text style={styles.label}>Overview Balance</Text>

        <View style={styles.headerActions}>
          <View
            style={[
              styles.currencyChip,
              { backgroundColor: selectedAccount.accentSoftColor },
            ]}>
            <Text
              style={[
                styles.currencyChipText,
                { color: selectedAccount.accentColor },
              ]}>
              {selectedAccount.currencyCode}
            </Text>
          </View>

          <Pressable
            accessibilityLabel={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            onPress={onToggleBalance}
            style={({ pressed }) => [styles.eyeButton, pressed && styles.pressed]}>
            <Feather
              color={Colors.text}
              name={isBalanceVisible ? 'eye' : 'eye-off'}
              size={17}
            />
          </Pressable>
        </View>
      </View>

      {isBalanceVisible ? (
        <CurrencyAmountText
          color={Colors.text}
          style={styles.balanceValue}
          value={selectedAccount.balance}
          variant="overview"
        />
      ) : (
        <Text style={styles.balanceValue}>{selectedAccount.maskedBalance}</Text>
      )}
      <Text style={styles.balanceHint}>{selectedAccount.balanceNote}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryLabel}>{selectedAccount.currencyLabel}</Text>
            <Text style={styles.summaryTitle}>{selectedAccount.displayName}</Text>
          </View>

          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{selectedAccount.statusLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryMeta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Account Number</Text>
            <Text style={styles.metaValue}>{selectedAccount.accountNumber}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Provider</Text>
            <Text style={styles.metaValue}>{selectedAccount.providerName}</Text>
          </View>
        </View>

        <Text style={styles.summaryNote}>{selectedAccount.summaryNote}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: Colors.border,
    borderRadius: 32,
    borderWidth: 1,
    overflow: 'hidden',
    padding: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  balanceHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  currencyChip: {
    alignItems: 'center',
    borderRadius: Radius.full,
    justifyContent: 'center',
    minWidth: 56,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  currencyChipText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  eyeButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  balanceValue: {
    color: Colors.text,
    lineHeight: 42,
    marginTop: Spacing.sm,
    minHeight: 42,
  },
  balanceHint: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  summaryCard: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
  },
  summaryHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  summaryTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: 6,
  },
  statusBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  statusText: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metaItem: {
    flex: 1,
    gap: 4,
  },
  metaLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  metaValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  summaryNote: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  pressed: {
    opacity: 0.92,
  },
});
