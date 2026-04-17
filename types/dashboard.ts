import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { AccountStatus } from './fintech';

export type DashboardQuickActionIcon = ComponentProps<typeof Feather>['name'];

export type DashboardAccount = {
  id: string;
  accountType: string;
  currencyCode: string;
  currencyLabel: string;
  displayName: string;
  balance: string;
  balanceValue?: number;
  availableBalance?: number;
  maskedBalance: string;
  balanceNote: string;
  accountNumber: string;
  providerName: string;
  status: AccountStatus;
  statusLabel: string;
  summaryNote: string;
  changeLabel: string;
  selectorHint: string;
  accentColor: string;
  accentSoftColor: string;
  actionLabel: string;
  fundingSourceLabel: string;
  minimumAddMoney: string;
  addMoneyQuickAmounts: string[];
  moveMoneyQuickAmounts: string[];
  detailsSections: DashboardAccountDetailsSection[];
  safeguardingNote: string;
  shareDetailsText: string;
};

export type DashboardAccountDetailItem = {
  id: string;
  label: string;
  value: string;
  helperText?: string;
};

export type DashboardAccountDetailsSection = {
  id: 'local' | 'international';
  title: string;
  description: string;
  items: DashboardAccountDetailItem[];
};

export type DashboardQuickAction = {
  id: string;
  label: string;
  iconName: DashboardQuickActionIcon;
  accentColor: string;
};

export type SavingsGoal = {
  id: string;
  name: string;
  savedAmount: string;
  targetAmount: string;
  progressPercentage: number;
  note: string;
  cadenceLabel: string;
  currencyCode?: string;
  savedAmountValue?: number;
  targetAmountValue?: number;
  autoSaveAmountValue?: number;
  autoSaveFrequency?: 'weekly' | 'biweekly' | 'monthly';
  targetDate?: string;
  sourceAccountId?: string;
};

export type DashboardReminder = {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
};

export type DashboardActivityPreviewItem = {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  amount: string;
  tone: 'positive' | 'negative';
  avatarText: string;
  avatarAccentColor: string;
  avatarTextColor?: string;
};

export type DashboardAccountSpendInsight = {
  accountId: string;
  accountLabel: string;
  currencyCode: string;
  totalSpentAmount: number;
  totalSpentDisplay: string;
  monthlyDeltaAmount: number;
  monthlyDeltaDisplay: string;
  monthlyDeltaDirection: 'up' | 'down' | 'flat';
  trendSeries: number[];
  trendLabels: string[];
  outgoingPaymentsCount: number;
  transferCount: number;
};

export type DashboardCurrencyWatchItem = {
  id: string;
  baseCurrencyCode: string;
  baseCurrencyLabel: string;
  quoteCurrencyCode: string;
  quoteCurrencyLabel: string;
  rate: number;
  displayRate: string;
  dailyChangePercentage: number;
  dailyChangeDisplay: string;
  direction: 'up' | 'down' | 'flat';
};

export type DashboardSnapshot = {
  greetingName: string;
  avatarInitials: string;
  defaultAccountId: string;
  accounts: DashboardAccount[];
  quickActions: DashboardQuickAction[];
  savingsGoals: SavingsGoal[];
  reminder: DashboardReminder;
  activityPreview: DashboardActivityPreviewItem[];
  spendInsights?: DashboardAccountSpendInsight[];
  currencyWatchlist?: DashboardCurrencyWatchItem[];
};
