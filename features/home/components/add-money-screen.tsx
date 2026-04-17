import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { LockedFeatureState } from '@/features/verification/components/locked-feature-state';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';
import { formatCurrencyAmount, getCurrencySymbol, parseCurrencyAmount } from '@/lib/currency';

import { getDashboardAccount, useHomeDashboard } from '../hooks/use-home-dashboard';
import { AccountSelectorSheet } from './account-selector-sheet';
import { AmountChipRow } from './amount-chip-row';
import { NumericKeypad } from './numeric-keypad';
import { PremiumScreenHeader } from './premium-screen-header';

function appendKey(currentValue: string, nextKey: string) {
  if (nextKey === '.' && currentValue.includes('.')) {
    return currentValue;
  }

  if (currentValue.includes('.')) {
    const fractionalPart = currentValue.split('.')[1] || '';

    if (fractionalPart.length >= 2) {
      return currentValue;
    }
  }

  if (currentValue === '0' && nextKey !== '.') {
    return nextKey;
  }

  return `${currentValue}${nextKey}`;
}

const SUBMISSION_NOTICE_DURATION_MS = 1600;
const SUBMISSION_REDIRECT_DELAY_MS = 250;

export function AddMoneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string }>();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, profile } = useVerification();
  const { createFundingTransaction } = useGoovaAppState();
  const [amountInput, setAmountInput] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isAccountSheetVisible, setIsAccountSheetVisible] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);
  const [isSubmissionTransitionActive, setIsSubmissionTransitionActive] = useState(false);

  useEffect(() => {
    if (!isSubmissionTransitionActive) {
      return;
    }

    const hideNoticeTimer = setTimeout(() => {
      setSubmissionMessage(null);
    }, SUBMISSION_NOTICE_DURATION_MS);

    const redirectTimer = setTimeout(() => {
      router.replace('/home' as never);
    }, SUBMISSION_NOTICE_DURATION_MS + SUBMISSION_REDIRECT_DELAY_MS);

    return () => {
      clearTimeout(hideNoticeTimer);
      clearTimeout(redirectTimer);
    };
  }, [isSubmissionTransitionActive, router]);

  if (isLoading || !dashboard) {
    return (
      <AppScreen scrollable={false} withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Preparing add money flow...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!access.canAddMoney) {
    return (
      <AppScreen withTabBarOffset={false}>
        <LockedFeatureState
          feature="add_money"
          onBack={() => router.back()}
          onVerifyNow={() =>
            router.push(getVerificationJourneyRoute(profile) as never)
          }
        />
      </AppScreen>
    );
  }

  const initialAccount = getDashboardAccount(dashboard.accounts, params.accountId);
  const selectedAccount =
    dashboard.accounts.find((account) => account.id === selectedAccountId) || initialAccount;
  const currencySymbol = getCurrencySymbol(selectedAccount.currencyCode);
  const fundingSourceLabel = `${selectedAccount.providerName} - ${selectedAccount.currencyCode}`;
  const parsedAmount = parseCurrencyAmount(amountInput);
  const amountIsValid = parsedAmount > 0;
  const amountDisplayValue = amountInput ? `${currencySymbol}${amountInput}` : currencySymbol;

  const handleAmountInputChange = (nextValue: string) => {
    if (isSubmissionTransitionActive) {
      return;
    }

    setAmountInput(nextValue);
  };

  const handleAccountSelect = (accountId: string) => {
    if (isSubmissionTransitionActive) {
      return;
    }

    setSelectedAccountId(accountId);
  };

  const handleContinue = () => {
    createFundingTransaction({
      accountId: selectedAccount.id,
      amount: parsedAmount,
      fundingSourceLabel,
    });
    setIsSubmissionTransitionActive(true);
    setSubmissionMessage(
      `${formatCurrencyAmount(selectedAccount.currencyCode, parsedAmount)} payment submitted to ${fundingSourceLabel}.`
    );
  };

  const handleDeletePress = () => {
    if (isSubmissionTransitionActive) {
      return;
    }

    setAmountInput((current) => current.slice(0, -1));
  };

  const handleKeyPress = (value: string) => {
    if (isSubmissionTransitionActive) {
      return;
    }

    setAmountInput((current) => appendKey(current, value));
  };

  return (
    <AppScreen
      contentContainerStyle={styles.screenContent}
      withTabBarOffset={false}>
      <View style={styles.screen}>
        <PremiumScreenHeader
          centered
          onBackPress={() => router.back()}
          subtitle={`Balance: ${selectedAccount.balance}`}
          title="Add money"
        />

        <View style={styles.amountArea}>
          <CurrencyAmountText
            align="center"
            color={Colors.text}
            style={styles.amountText}
            value={amountDisplayValue}
            variant="screen"
          />

          <View style={styles.minimumRow}>
            <Feather color={Colors.warning} name="alert-circle" size={18} />
            <Text style={styles.minimumText}>{selectedAccount.minimumAddMoney}</Text>
          </View>

          <AppButton
            containerStyle={styles.sourceButton}
            disabled={isSubmissionTransitionActive}
            onPress={() => setIsAccountSheetVisible(true)}
            title={fundingSourceLabel}
            variant="secondary"
          />
        </View>

        <View style={styles.bottomArea}>
          {submissionMessage ? <NoticeBanner message={submissionMessage} tone="success" /> : null}

          <AppButton
            disabled={!amountIsValid || isSubmissionTransitionActive}
            onPress={handleContinue}
            title="Continue"
            variant="secondary"
          />

          <AmountChipRow
            onSelect={(value) =>
              handleAmountInputChange(
                String(parseCurrencyAmount(value)).replace(/\.0+$/, '')
              )
            }
            values={selectedAccount.addMoneyQuickAmounts}
          />

          <NumericKeypad
            onDeletePress={handleDeletePress}
            onKeyPress={handleKeyPress}
          />
        </View>
      </View>

      <AccountSelectorSheet
        accounts={dashboard.accounts}
        onClose={() => setIsAccountSheetVisible(false)}
        onSelect={handleAccountSelect}
        selectedAccountId={selectedAccount.id}
        title="Select account"
        visible={isAccountSheetVisible}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flexGrow: 1,
  },
  screen: {
    flexGrow: 1,
    gap: Spacing.xxl,
  },
  loadingState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: 16,
  },
  amountArea: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.lg,
  },
  amountText: {
    minHeight: 72,
  },
  minimumRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  minimumText: {
    color: Colors.warning,
    fontSize: 16,
  },
  sourceButton: {
    borderRadius: Radius.full,
    minHeight: 52,
  },
  bottomArea: {
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
});
