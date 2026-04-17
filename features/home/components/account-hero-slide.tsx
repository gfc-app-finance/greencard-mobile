import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { formatCurrencyAmount, parseCurrencyAmount } from '@/lib/currency';
import type { DashboardAccount } from '@/types/dashboard';

type AccountHeroSlideProps = {
  account: DashboardAccount;
  onAccountsPress?: () => void;
};

export function AccountHeroSlide({ account, onAccountsPress }: AccountHeroSlideProps) {
  const formattedBalance = formatCurrencyAmount(
    account.currencyCode,
    parseCurrencyAmount(account.balance)
  );

  return (
    <View style={styles.slide}>
      <Text style={styles.accountLabel}>{`${account.accountType} - ${account.currencyCode}`}</Text>

      <View style={styles.balanceRow}>
        <CurrencyAmountText
          align="center"
          color={Colors.text}
          value={formattedBalance}
          variant="accountHero"
        />
      </View>

      <Pressable onPress={onAccountsPress} style={styles.accountsButton}>
        <Text style={styles.accountsButtonText}>{account.actionLabel}</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 244,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.03,
    shadowRadius: 18,
  },
  accountLabel: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    fontWeight: '600',
    letterSpacing: Typography.secondary.letterSpacing,
    lineHeight: Typography.secondary.lineHeight,
    marginBottom: Spacing.md,
  },
  balanceRow: {
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  accountsButton: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.full,
    minHeight: 46,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 11,
  },
  accountsButtonText: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
});

