import { createContext, type PropsWithChildren,useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Colors } from '@/constants/colors';
import { hasActiveManagedCard } from '@/features/cards/card-access';
import { formatCurrencyAmount, parseCurrencyAmount } from '@/lib/currency';
import {
  buildCardActivity,
  buildFundingActivity,
  buildPaymentActivity,
  buildRecipientsFromPayments,
  buildTransferActivity,
  createInitialGoovaAppState,
  getAccountStatusLabel,
  getFundingStatusLabel,
  getManagedCardStatusLabel,
  getPaymentProcessingStatusLabel,
  getTransferStatusLabel,
} from '@/services/goova-app-state-service';
import { buildPaymentTimeline, getMockRecentPayments } from '@/services/payments-service';
import type { SavingsGoal } from '@/types/dashboard';
import type {
  AppAccount,
  AppActivityItem,
  FundingTransaction,
  GoovaAppState,
  IncomeSortingConfig,
  IncomeSortingRule,
  ManagedCard,
  RecipientRecord,
  TransferTransaction,
} from '@/types/fintech';
import type { PaymentRecord } from '@/types/payments';

type CreateFundingInput = {
  accountId: string;
  amount: number;
  fundingSourceLabel: string;
};

type CreateTransferInput = {
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAmount: number;
  destinationAmount: number;
  rate: number;
  note: string;
};

type CreateSavingsGoalInput = {
  name: string;
  currencyCode: string;
  targetAmount: number;
  targetDate: string;
  autoSaveAmount: number;
  autoSaveFrequency: 'weekly' | 'biweekly' | 'monthly';
  sourceAccountId?: string;
};

type AddGoalContributionInput = {
  goalId: string;
  amount: number;
};

type UpdateIncomeSortingRuleInput = {
  ruleId: IncomeSortingRule['id'];
  allocationPercentage?: number;
  destinationGoalId?: string | null;
  enabled?: boolean;
};

type GoovaAppStateContextValue = {
  accounts: AppAccount[];
  activities: AppActivityItem[];
  cards: ManagedCard[];
  fundings: FundingTransaction[];
  transfers: TransferTransaction[];
  payments: PaymentRecord[];
  savingsGoals: GoovaAppState['savingsGoals'];
  incomeSorting: IncomeSortingConfig;
  recipients: RecipientRecord[];
  createFundingTransaction: (input: CreateFundingInput) => FundingTransaction | null;
  createTransferTransaction: (input: CreateTransferInput) => TransferTransaction | null;
  createSavingsGoal: (input: CreateSavingsGoalInput) => SavingsGoal;
  addGoalContribution: (input: AddGoalContributionInput) => SavingsGoal | null;
  setIncomeSortingEnabled: (enabled: boolean) => void;
  setIncomeSortingMinimumTriggerAmount: (amount: number) => void;
  updateIncomeSortingRule: (input: UpdateIncomeSortingRuleInput) => void;
  addPaymentRecord: (payment: PaymentRecord) => PaymentRecord;
  createVirtualAccount: () => AppAccount;
  createCard: () => ManagedCard | null;
  toggleCardFrozen: (cardId: string) => ManagedCard | null;
  getAccountById: (accountId: string | undefined) => AppAccount | null;
  getActivityById: (activityId: string | undefined) => AppActivityItem | null;
  getPaymentById: (paymentId: string | undefined) => PaymentRecord | null;
};

const GoovaAppStateContext = createContext<GoovaAppStateContextValue | null>(null);

function makeReference(prefix: string) {
  return `GCF-${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function buildNewCardRecord(accounts: AppAccount[]): ManagedCard {
  const preferredFundingSource =
    accounts.find((account) => account.currencyCode === 'USD') ||
    accounts.find((account) => account.currencyCode === 'GBP') ||
    accounts.find((account) => account.currencyCode === 'EUR') ||
    accounts[0];
  const suffix = `${Math.floor(Math.random() * 9000) + 1000}`;
  const supportedBalances = accounts
    .filter((account) => ['USD', 'GBP', 'EUR'].includes(account.currencyCode))
    .map((account) => account.currencyCode);

  return {
    id: `goova-card-${suffix}`,
    name: 'USD',
    network: 'Visa',
    type: 'Virtual',
    last4: suffix,
    currency: 'Foreign online spend',
    spendLimit: 'USD 2,500 / month',
    spendLimitAmount: 2500,
    spendLimitCurrencyCode: 'USD',
    monthlySpentAmount: 0,
    monthlySpentDisplay: formatCurrencyAmount('USD', 0),
    fundingSourceAccountId: preferredFundingSource.id,
    fundingSourceLabel: preferredFundingSource.displayName,
    fundingSourceBalanceDisplay: formatCurrencyAmount(
      preferredFundingSource.currencyCode,
      preferredFundingSource.availableBalance
    ),
    linkedBalanceLabel:
      supportedBalances.length > 0
        ? supportedBalances.join(', ')
        : preferredFundingSource.currencyCode,
    usageNote: 'Use one GCF virtual card for international online payments.',
    status: 'pending',
    createdAt: new Date().toISOString(),
    recentActivity: [],
  };
}

const preferredVirtualCurrencies = ['NGN', 'USD', 'GBP', 'EUR'] as const;

function buildNewVirtualAccountRecord(accounts: AppAccount[]): AppAccount {
  const existingVirtualCount = accounts.filter((account) =>
    account.accountType.toLowerCase().includes('virtual')
  ).length;
  const preferredCurrency =
    preferredVirtualCurrencies[existingVirtualCount % preferredVirtualCurrencies.length];
  const template =
    accounts.find((account) => account.currencyCode === preferredCurrency) || accounts[0];
  const sequenceNumber = existingVirtualCount + 1;
  const accountNumber = `${Math.floor(Math.random() * 9000000000) + 1000000000}`;

  return {
    ...template,
    id: `virtual_${Date.now()}_${sequenceNumber}`,
    accountType: 'Virtual',
    displayName: `${template.currencyCode} Virtual ${sequenceNumber}`,
    balance: 0,
    availableBalance: 0,
    maskedBalance: `${template.currencyCode} *,***.**`,
    accountNumber,
    summaryNote: `New ${template.currencyCode} virtual account created and ready for verified flows.`,
    changeLabel: 'Just created',
    selectorHint: 'Virtual account',
    fundingSourceLabel: `GCF Virtual Rail - ${template.currencyCode}`,
    shareDetailsText: `${template.displayName}\nBeneficiary: GCF User\nAccount number: ${accountNumber}\nCurrency: ${template.currencyCode}`,
    status: 'active',
  };
}

function formatGoalTargetLabel(targetDate: string) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(targetDate)
  );
}

function buildGoalCadenceLabel(targetDate: string, autoSaveFrequency: CreateSavingsGoalInput['autoSaveFrequency']) {
  const targetLabel = formatGoalTargetLabel(targetDate);
  const frequencyCopy =
    autoSaveFrequency === 'weekly'
      ? 'every week'
      : autoSaveFrequency === 'biweekly'
        ? 'every 2 weeks'
        : 'every month';
  return `Target by ${targetLabel} · Auto-save ${frequencyCopy}`;
}

export function GoovaAppStateProvider({ children }: PropsWithChildren) {
  const initialPayments = useMemo(() => getMockRecentPayments(), []);
  const initialState = useMemo(() => createInitialGoovaAppState(initialPayments), [initialPayments]);
  const [accounts, setAccounts] = useState(initialState.accounts);
  const [activities, setActivities] = useState(initialState.activities);
  const [cards, setCards] = useState(initialState.cards);
  const [fundings, setFundings] = useState(initialState.fundings);
  const [transfers, setTransfers] = useState(initialState.transfers);
  const [payments, setPayments] = useState(initialPayments);
  const [savingsGoals, setSavingsGoals] = useState(initialState.savingsGoals);
  const [incomeSorting, setIncomeSorting] = useState(initialState.incomeSorting);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const schedule = useCallback((callback: () => void, delayMs: number) => {
    const timer = setTimeout(callback, delayMs);
    timersRef.current.push(timer);
  }, []);

  const prependActivity = useCallback((activity: AppActivityItem) => {
    setActivities((current) => [activity, ...current]);
  }, []);

  const syncActivityStatus = useCallback(
    (
      entityType: AppActivityItem['linkedEntityType'],
      entityId: string,
      status: AppActivityItem['status'],
      statusLabel: string
    ) => {
      setActivities((current) =>
        current.map((activity) =>
          activity.linkedEntityType === entityType && activity.linkedEntityId === entityId
            ? {
                ...activity,
                status,
                statusLabel,
              }
            : activity
        )
      );
    },
    []
  );

  const applyFundingCompletion = useCallback((funding: FundingTransaction) => {
    setAccounts((current) =>
      current.map((account) =>
        account.id === funding.accountId
          ? {
              ...account,
              balance: account.balance + funding.amount,
              availableBalance: account.availableBalance + funding.amount,
            }
          : account
      )
    );
  }, []);

  const applyTransferCompletion = useCallback((transfer: TransferTransaction) => {
    setAccounts((current) =>
      current.map((account) => {
        if (account.id === transfer.sourceAccountId) {
          return {
            ...account,
            balance: account.balance - transfer.sourceAmount,
            availableBalance: account.availableBalance - transfer.sourceAmount,
          };
        }

        if (account.id === transfer.destinationAccountId) {
          return {
            ...account,
            balance: account.balance + transfer.destinationAmount,
            availableBalance: account.availableBalance + transfer.destinationAmount,
          };
        }

        return account;
      })
    );
  }, []);

  const advanceFundingStatus = useCallback(
    (fundingId: string, nextStatus: FundingTransaction['status']) => {
      let completedFunding: FundingTransaction | null = null;

      setFundings((current) =>
        current.map((funding) => {
          if (funding.id !== fundingId) {
            return funding;
          }

          const updatedFunding = {
            ...funding,
            status: nextStatus,
          };

          if (funding.status !== 'completed' && nextStatus === 'completed') {
            completedFunding = updatedFunding;
          }

          return updatedFunding;
        })
      );

      syncActivityStatus('funding', fundingId, nextStatus, getFundingStatusLabel(nextStatus));

      if (completedFunding) {
        applyFundingCompletion(completedFunding);
      }
    },
    [applyFundingCompletion, syncActivityStatus]
  );

  const advanceTransferStatus = useCallback(
    (transferId: string, nextStatus: TransferTransaction['status']) => {
      let completedTransfer: TransferTransaction | null = null;

      setTransfers((current) =>
        current.map((transfer) => {
          if (transfer.id !== transferId) {
            return transfer;
          }

          const updatedTransfer = {
            ...transfer,
            status: nextStatus,
          };

          if (transfer.status !== 'completed' && nextStatus === 'completed') {
            completedTransfer = updatedTransfer;
          }

          return updatedTransfer;
        })
      );

      syncActivityStatus('transfer', transferId, nextStatus, getTransferStatusLabel(nextStatus));

      if (completedTransfer) {
        applyTransferCompletion(completedTransfer);
      }
    },
    [applyTransferCompletion, syncActivityStatus]
  );

  const advancePaymentStatus = useCallback(
    (paymentId: string, nextStatus: PaymentRecord['status']) => {
      setPayments((current) =>
        current.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                status: nextStatus,
                statusLabel: getPaymentProcessingStatusLabel(nextStatus),
                timeline: buildPaymentTimeline(nextStatus, payment.createdAt),
              }
            : payment
        )
      );

      syncActivityStatus('payment', paymentId, nextStatus, getPaymentProcessingStatusLabel(nextStatus));
    },
    [syncActivityStatus]
  );

  const createFundingTransaction = useCallback(
    ({ accountId, amount, fundingSourceLabel }: CreateFundingInput) => {
      const account = accounts.find((entry) => entry.id === accountId);

      if (!account) {
        return null;
      }

      const funding: FundingTransaction = {
        id: `funding_${Date.now()}`,
        accountId,
        accountLabel: account.displayName,
        amount,
        currencyCode: account.currencyCode,
        fundingSourceLabel,
        status: 'initiated',
        reference: makeReference('FUND'),
        createdAt: new Date().toISOString(),
      };

      setFundings((current) => [funding, ...current]);
      prependActivity(buildFundingActivity(funding));

      schedule(() => advanceFundingStatus(funding.id, 'pending'), 700);
      schedule(() => advanceFundingStatus(funding.id, 'completed'), 3200);

      return funding;
    },
    [accounts, advanceFundingStatus, prependActivity, schedule]
  );

  const createTransferTransaction = useCallback(
    ({
      sourceAccountId,
      destinationAccountId,
      sourceAmount,
      destinationAmount,
      rate,
      note,
    }: CreateTransferInput) => {
      const sourceAccount = accounts.find((entry) => entry.id === sourceAccountId);
      const destinationAccount = accounts.find((entry) => entry.id === destinationAccountId);

      if (!sourceAccount || !destinationAccount) {
        return null;
      }

      const transfer: TransferTransaction = {
        id: `transfer_${Date.now()}`,
        sourceAccountId,
        sourceAccountLabel: sourceAccount.displayName,
        destinationAccountId,
        destinationAccountLabel: destinationAccount.displayName,
        sourceAmount,
        sourceCurrencyCode: sourceAccount.currencyCode,
        destinationAmount,
        destinationCurrencyCode: destinationAccount.currencyCode,
        rate,
        note,
        status: 'initiated',
        reference: makeReference('FX'),
        createdAt: new Date().toISOString(),
      };

      setTransfers((current) => [transfer, ...current]);
      prependActivity(buildTransferActivity(transfer));

      schedule(() => advanceTransferStatus(transfer.id, 'converting'), 700);
      schedule(() => advanceTransferStatus(transfer.id, 'completed'), 2800);

      return transfer;
    },
    [accounts, advanceTransferStatus, prependActivity, schedule]
  );

  const createSavingsGoal = useCallback(
    ({
      name,
      currencyCode,
      targetAmount,
      targetDate,
      autoSaveAmount,
      autoSaveFrequency,
      sourceAccountId,
    }: CreateSavingsGoalInput) => {
      const savedAmountValue = 0;
      const safeTargetAmount = targetAmount > 0 ? targetAmount : 0;
      const normalizedName = name.trim() || 'New Goal';
      const createdAt = new Date().toISOString();

      const goal: SavingsGoal = {
        id: `goal_${Date.now()}`,
        name: normalizedName,
        savedAmount: formatCurrencyAmount(currencyCode, savedAmountValue),
        targetAmount: formatCurrencyAmount(currencyCode, safeTargetAmount),
        progressPercentage: 0,
        note:
          autoSaveAmount > 0
            ? `Auto-save ${formatCurrencyAmount(currencyCode, autoSaveAmount)} ${autoSaveFrequency}.`
            : 'Manual contributions enabled.',
        cadenceLabel: buildGoalCadenceLabel(targetDate, autoSaveFrequency),
        currencyCode,
        savedAmountValue,
        targetAmountValue: safeTargetAmount,
        autoSaveAmountValue: autoSaveAmount,
        autoSaveFrequency,
        targetDate,
        sourceAccountId,
      };

      setSavingsGoals((current) => [goal, ...current]);
      prependActivity({
        id: `activity_goal_setup_${goal.id}`,
        type: 'account',
        title: `${goal.name} goal created`,
        subtitle: goal.cadenceLabel,
        description: `Target ${goal.targetAmount} with ${goal.note.toLowerCase()}`,
        createdAt,
        status: 'active',
        statusLabel: 'Active',
        tone: 'neutral',
        avatarText: 'SG',
        avatarAccentColor: Colors.primarySoft,
      });

      return goal;
    },
    [prependActivity]
  );

  const addGoalContribution = useCallback(
    ({ goalId, amount }: AddGoalContributionInput) => {
      const goal = savingsGoals.find((entry) => entry.id === goalId);

      if (!goal) {
        return null;
      }

      const currencyCode = goal.currencyCode || 'NGN';
      const currentSavedAmount = goal.savedAmountValue ?? parseCurrencyAmount(goal.savedAmount);
      const targetAmount = goal.targetAmountValue ?? parseCurrencyAmount(goal.targetAmount);
      const safeTargetAmount = targetAmount > 0 ? targetAmount : amount;
      const nextSavedAmount = Math.min(currentSavedAmount + amount, safeTargetAmount);
      const progressPercentage = Math.min(
        100,
        Math.round((nextSavedAmount / Math.max(safeTargetAmount, 1)) * 100)
      );
      const updatedGoal: SavingsGoal = {
        ...goal,
        savedAmount: formatCurrencyAmount(currencyCode, nextSavedAmount),
        targetAmount: formatCurrencyAmount(currencyCode, safeTargetAmount),
        savedAmountValue: nextSavedAmount,
        targetAmountValue: safeTargetAmount,
        progressPercentage,
        note: progressPercentage >= 100 ? 'Goal funded and ready.' : goal.note,
      };

      setSavingsGoals((current) =>
        current.map((entry) => (entry.id === goalId ? updatedGoal : entry))
      );

      prependActivity({
        id: `activity_goal_funding_${goalId}_${Date.now()}`,
        type: 'transfer',
        title: `Saved ${formatCurrencyAmount(currencyCode, amount)} to ${updatedGoal.name}`,
        subtitle: `${updatedGoal.progressPercentage}% funded`,
        description: 'Goal contribution added from your wallet balance.',
        amount,
        currencyCode,
        createdAt: new Date().toISOString(),
        status: 'completed',
        statusLabel: getTransferStatusLabel('completed'),
        tone: 'positive',
        avatarText: 'SG',
        avatarAccentColor: Colors.violetSoft,
      });

      return updatedGoal;
    },
    [prependActivity, savingsGoals]
  );

  const setIncomeSortingEnabled = useCallback((enabled: boolean) => {
    setIncomeSorting((current) => ({
      ...current,
      enabled,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const setIncomeSortingMinimumTriggerAmount = useCallback((amount: number) => {
    setIncomeSorting((current) => ({
      ...current,
      minimumTriggerAmount: amount,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const updateIncomeSortingRule = useCallback(
    ({ ruleId, allocationPercentage, destinationGoalId, enabled }: UpdateIncomeSortingRuleInput) => {
      setIncomeSorting((current) => ({
        ...current,
        rules: current.rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                allocationPercentage:
                  typeof allocationPercentage === 'number'
                    ? Math.max(0, Math.min(100, Math.round(allocationPercentage)))
                    : rule.allocationPercentage,
                destinationGoalId:
                  destinationGoalId !== undefined ? destinationGoalId : rule.destinationGoalId,
                enabled: typeof enabled === 'boolean' ? enabled : rule.enabled,
              }
            : rule
        ),
        updatedAt: new Date().toISOString(),
      }));
    },
    []
  );

  const addPaymentRecord = useCallback(
    (payment: PaymentRecord) => {
      setPayments((current) => [payment, ...current]);
      prependActivity(buildPaymentActivity(payment));

      if (payment.status === 'submitted') {
        schedule(() => advancePaymentStatus(payment.id, 'under_review'), 1800);
        schedule(() => advancePaymentStatus(payment.id, 'processing'), 4200);
        schedule(() => advancePaymentStatus(payment.id, 'completed'), 7200);
      }

      return payment;
    },
    [advancePaymentStatus, prependActivity, schedule]
  );

  const createCard = useCallback(() => {
    if (hasActiveManagedCard(cards)) {
      return null;
    }

    const card = buildNewCardRecord(accounts);
    setCards([card]);
    prependActivity(buildCardActivity(card));

    schedule(() => {
      setCards((current) =>
        current.map((entry) =>
          entry.id === card.id
            ? {
                ...entry,
                status: 'active',
              }
            : entry
        )
      );
      syncActivityStatus('card', card.id, 'active', getManagedCardStatusLabel('active'));
    }, 1400);

    return card;
  }, [accounts, cards, prependActivity, schedule, syncActivityStatus]);

  const createVirtualAccount = useCallback(() => {
    const virtualAccount = buildNewVirtualAccountRecord(accounts);

    setAccounts((current) => [virtualAccount, ...current]);
    prependActivity({
      id: `activity_account_virtual_${virtualAccount.id}`,
      type: 'account',
      title: `${virtualAccount.currencyCode} virtual account created`,
      subtitle: virtualAccount.displayName,
      description:
        'A new virtual account has been created and can now be used for verified flows.',
      createdAt: new Date().toISOString(),
      status: 'active',
      statusLabel: getAccountStatusLabel('active'),
      tone: 'neutral',
      avatarText: virtualAccount.currencyCode,
      avatarAccentColor: Colors.primarySoft,
      linkedEntityId: virtualAccount.id,
      linkedEntityType: 'account',
    });

    return virtualAccount;
  }, [accounts, prependActivity]);

  const toggleCardFrozen = useCallback((cardId: string) => {
    const currentCard = cards.find((card) => card.id === cardId) || null;

    if (!currentCard || currentCard.status === 'pending' || currentCard.status === 'terminated') {
      return null;
    }

    const updatedCard: ManagedCard = {
      ...currentCard,
      status: currentCard.status === 'frozen' ? 'active' : 'frozen',
    };

    setCards((current) =>
      current.map((card) => (card.id === cardId ? updatedCard : card))
    );

    return updatedCard;
  }, [cards]);

  const recipients = useMemo(() => buildRecipientsFromPayments(payments), [payments]);

  const value = useMemo<GoovaAppStateContextValue>(
    () => ({
      accounts,
      activities,
      cards,
      fundings,
      transfers,
      payments,
      savingsGoals,
      incomeSorting,
      recipients,
      createFundingTransaction,
      createTransferTransaction,
      createSavingsGoal,
      addGoalContribution,
      setIncomeSortingEnabled,
      setIncomeSortingMinimumTriggerAmount,
      updateIncomeSortingRule,
      addPaymentRecord,
      createVirtualAccount,
      createCard,
      toggleCardFrozen,
      getAccountById(accountId) {
        if (!accountId) {
          return null;
        }

        return accounts.find((account) => account.id === accountId) || null;
      },
      getActivityById(activityId) {
        if (!activityId) {
          return null;
        }

        return activities.find((activity) => activity.id === activityId) || null;
      },
      getPaymentById(paymentId) {
        if (!paymentId) {
          return null;
        }

        return payments.find((payment) => payment.id === paymentId) || null;
      },
    }),
    [
      accounts,
      activities,
      addPaymentRecord,
      cards,
      createCard,
      createFundingTransaction,
      createTransferTransaction,
      fundings,
      createSavingsGoal,
      addGoalContribution,
      incomeSorting,
      payments,
      recipients,
      savingsGoals,
      setIncomeSortingEnabled,
      setIncomeSortingMinimumTriggerAmount,
      toggleCardFrozen,
      transfers,
      updateIncomeSortingRule,
      createVirtualAccount,
    ]
  );

  return <GoovaAppStateContext.Provider value={value}>{children}</GoovaAppStateContext.Provider>;
}

export function useGoovaAppState() {
  const context = useContext(GoovaAppStateContext);

  if (!context) {
    throw new Error('useGoovaAppState must be used within GoovaAppStateProvider.');
  }

  return context;
}
