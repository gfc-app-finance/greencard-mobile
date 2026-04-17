import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { LockedFeatureState } from '@/features/verification/components/locked-feature-state';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';
import {
  formatCurrencyAmount,
  getCurrencySymbol,
  parseCurrencyAmount,
} from '@/lib/currency';

import { getDashboardAccount, useHomeDashboard } from '../hooks/use-home-dashboard';
import { AccountSelectorSheet } from './account-selector-sheet';
import { AmountChipRow } from './amount-chip-row';
import { MoveMoneyAccountCard } from './move-money-account-card';
import { MoveMoneyReviewDialog } from './move-money-review-dialog';
import { NumericKeypad } from './numeric-keypad';
import { PremiumScreenHeader } from './premium-screen-header';

const mockRates: Record<string, Record<string, number>> = {
  USD: {
    GBP: 0.74129,
    EUR: 0.9182,
    NGN: 1540,
  },
  GBP: {
    USD: 1.349,
    EUR: 1.238,
    NGN: 2078,
  },
  EUR: {
    USD: 1.089,
    GBP: 0.807,
    NGN: 1678,
  },
  NGN: {
    USD: 0.00065,
    GBP: 0.00048,
    EUR: 0.00059,
  },
};

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

function getFirstDifferentAccountId(accountIds: string[], excludedId: string) {
  return accountIds.find((accountId) => accountId !== excludedId) || excludedId;
}

export function MoveMoneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountId?: string }>();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, profile } = useVerification();
  const { createTransferTransaction } = useGoovaAppState();
  const [sourceAccountId, setSourceAccountId] = useState<string | null>(null);
  const [destinationAccountId, setDestinationAccountId] = useState<string | null>(null);
  const [selectorTarget, setSelectorTarget] = useState<'source' | 'destination' | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [isReviewDialogVisible, setIsReviewDialogVisible] = useState(false);
  const [submissionMessage, setSubmissionMessage] = useState<string | null>(null);

  const initialAccountId = useMemo(() => {
    if (!dashboard) {
      return '';
    }

    return getDashboardAccount(dashboard.accounts, params.accountId).id;
  }, [dashboard, params.accountId]);

  useEffect(() => {
    if (!dashboard || !initialAccountId) {
      return;
    }

    const accountIds = dashboard.accounts.map((account) => account.id);
    setSourceAccountId(initialAccountId);
    setDestinationAccountId(getFirstDifferentAccountId(accountIds, initialAccountId));
  }, [dashboard, initialAccountId]);

  if (isLoading || !dashboard || !sourceAccountId || !destinationAccountId) {
    return (
      <AppScreen scrollable={false} withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Preparing money movement...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!access.canMoveMoney) {
    return (
      <AppScreen withTabBarOffset={false}>
        <LockedFeatureState
          feature="move_money"
          onBack={() => router.back()}
          onVerifyNow={() =>
            router.push(getVerificationJourneyRoute(profile) as never)
          }
        />
      </AppScreen>
    );
  }

  const sourceAccount = getDashboardAccount(dashboard.accounts, sourceAccountId);
  const destinationAccount = getDashboardAccount(dashboard.accounts, destinationAccountId);
  const rate = mockRates[sourceAccount.currencyCode]?.[destinationAccount.currencyCode] || 1;
  const parsedAmount = parseCurrencyAmount(amountInput);
  const convertedAmount = parsedAmount * rate;
  const reviewDisabled = !parsedAmount || sourceAccount.id === destinationAccount.id;

  const handleSheetSelect = (accountId: string) => {
    setSubmissionMessage(null);

    if (selectorTarget === 'source') {
      setSourceAccountId(accountId);

      if (accountId === destinationAccountId) {
        const fallbackAccountId = getFirstDifferentAccountId(
          dashboard.accounts.map((account) => account.id),
          accountId
        );
        setDestinationAccountId(fallbackAccountId);
      }
      return;
    }

    if (selectorTarget === 'destination') {
      setDestinationAccountId(accountId);

      if (accountId === sourceAccountId) {
        const fallbackAccountId = getFirstDifferentAccountId(
          dashboard.accounts.map((account) => account.id),
          accountId
        );
        setSourceAccountId(fallbackAccountId);
      }
    }
  };

  const rateLabel = `1 ${sourceAccount.currencyCode} = ${formatCurrencyAmount(
    destinationAccount.currencyCode,
    rate
  )}`;
  const sourceAmountLabel = parsedAmount
    ? `-${formatCurrencyAmount(sourceAccount.currencyCode, parsedAmount)}`
    : `-${getCurrencySymbol(sourceAccount.currencyCode)}0`;
  const destinationAmountLabel = parsedAmount
    ? `+${formatCurrencyAmount(destinationAccount.currencyCode, convertedAmount)}`
    : `+${getCurrencySymbol(destinationAccount.currencyCode)}0`;
  const transferFeeLabel = 'Free';
  const arrivalLabel = rate === 1 ? 'Instant' : 'Usually within seconds';

  const handleConfirmTransfer = () => {
    createTransferTransaction({
      sourceAccountId: sourceAccount.id,
      destinationAccountId: destinationAccount.id,
      sourceAmount: parsedAmount,
      destinationAmount: convertedAmount,
      rate,
      note,
    });
    setIsReviewDialogVisible(false);
    setSubmissionMessage(
      `Transfer started for ${formatCurrencyAmount(sourceAccount.currencyCode, parsedAmount)}. Track the status in Recent Activity.`
    );
  };

  return (
    <AppScreen
      contentContainerStyle={styles.screenContent}
      withTabBarOffset={false}>
      <View style={styles.screen}>
        <View style={styles.topArea}>
          <PremiumScreenHeader
            centered
            onBackPress={() => router.back()}
            subtitle={rateLabel}
            title="Move money"
          />

          <View style={styles.cardsStack}>
            <MoveMoneyAccountCard
              account={sourceAccount}
              amountLabel={sourceAmountLabel}
              onPress={() => setSelectorTarget('source')}
            />

            <View style={styles.swapButtonWrap}>
              <Pressable
                onPress={() => {
                  setSourceAccountId(destinationAccount.id);
                  setDestinationAccountId(sourceAccount.id);
                }}
                style={styles.swapButton}>
                <Feather color={Colors.background} name="arrow-down" size={22} />
              </Pressable>
            </View>

            <MoveMoneyAccountCard
              account={destinationAccount}
              amountLabel={destinationAmountLabel}
              onPress={() => setSelectorTarget('destination')}
            />
          </View>

          <TextInput
            onChangeText={(value) => {
              setSubmissionMessage(null);
              setNote(value);
            }}
            placeholder="Add note"
            placeholderTextColor="rgba(255, 255, 255, 0.34)"
            style={styles.noteInput}
            value={note}
          />
        </View>

        <View style={styles.bottomArea}>
          {submissionMessage ? <NoticeBanner message={submissionMessage} tone="success" /> : null}

          <View style={styles.reviewRow}>
            <Pressable
              onPress={() => Alert.alert('Settings coming soon', 'Advanced order controls will wire here.')}
              style={styles.filterButton}>
              <Feather color={Colors.background} name="sliders" size={22} />
            </Pressable>

            <View style={styles.reviewButtonWrap}>
              <AppButton
                disabled={reviewDisabled}
                onPress={() => setIsReviewDialogVisible(true)}
                title="Review order"
                variant="secondary"
              />
            </View>
          </View>

          <AmountChipRow
            onSelect={(value) =>
              {
                setSubmissionMessage(null);
                setAmountInput(String(parseCurrencyAmount(value)).replace(/\.0+$/, ''));
              }
            }
            values={sourceAccount.moveMoneyQuickAmounts}
          />

          <NumericKeypad
            onDeletePress={() => {
              setSubmissionMessage(null);
              setAmountInput((current) => current.slice(0, -1));
            }}
            onKeyPress={(value) => {
              setSubmissionMessage(null);
              setAmountInput((current) => appendKey(current, value));
            }}
          />
        </View>
      </View>

      <AccountSelectorSheet
        accounts={dashboard.accounts}
        onClose={() => setSelectorTarget(null)}
        onSelect={handleSheetSelect}
        selectedAccountId={
          selectorTarget === 'destination' ? destinationAccount.id : sourceAccount.id
        }
        title={selectorTarget === 'destination' ? 'Choose destination account' : 'Choose source account'}
        visible={Boolean(selectorTarget)}
      />

      <MoveMoneyReviewDialog
        arrivalLabel={arrivalLabel}
        destinationAccount={destinationAccount}
        destinationAmountLabel={destinationAmountLabel}
        feeLabel={transferFeeLabel}
        note={note}
        onClose={() => setIsReviewDialogVisible(false)}
        onConfirm={handleConfirmTransfer}
        rateLabel={rateLabel}
        sourceAccount={sourceAccount}
        sourceAmountLabel={sourceAmountLabel}
        visible={isReviewDialogVisible}
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
  topArea: {
    gap: Spacing.md,
  },
  cardsStack: {
    position: 'relative',
  },
  swapButtonWrap: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: '50%',
    zIndex: 2,
  },
  swapButton: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.full,
    height: 52,
    justifyContent: 'center',
    marginTop: -26,
    width: 52,
  },
  noteInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    color: Colors.text,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bottomArea: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  reviewRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  filterButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  reviewButtonWrap: {
    flex: 1,
  },
});
