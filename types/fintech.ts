import type { DashboardAccountDetailsSection, SavingsGoal } from './dashboard';
import type { PaymentRecord } from './payments';

export type AccountStatus = 'pending' | 'active' | 'restricted';

export type FundingTransactionStatus = 'initiated' | 'pending' | 'completed' | 'failed';

export type PaymentProcessingStatus =
  | 'submitted'
  | 'under_review'
  | 'processing'
  | 'completed'
  | 'failed';

export type TransferStatus = 'initiated' | 'converting' | 'completed' | 'failed';

export type ManagedCardStatus = 'pending' | 'active' | 'frozen' | 'terminated';

export type AppActivityType = 'funding' | 'payment' | 'transfer' | 'account' | 'card';

export type AppActivityStatus =
  | FundingTransactionStatus
  | PaymentProcessingStatus
  | TransferStatus
  | AccountStatus;

export type AppActivityTone = 'positive' | 'negative' | 'neutral';

export type AppActivityLinkedEntityType = 'funding' | 'payment' | 'transfer' | 'account' | 'card';

export type AppAccount = {
  id: string;
  accountType: string;
  currencyCode: string;
  currencyLabel: string;
  displayName: string;
  balance: number;
  availableBalance: number;
  maskedBalance: string;
  balanceNote: string;
  accountNumber: string;
  providerName: string;
  status: AccountStatus;
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

export type FundingTransaction = {
  id: string;
  accountId: string;
  accountLabel: string;
  amount: number;
  currencyCode: string;
  fundingSourceLabel: string;
  status: FundingTransactionStatus;
  reference: string;
  createdAt: string;
};

export type TransferTransaction = {
  id: string;
  sourceAccountId: string;
  sourceAccountLabel: string;
  destinationAccountId: string;
  destinationAccountLabel: string;
  sourceAmount: number;
  sourceCurrencyCode: string;
  destinationAmount: number;
  destinationCurrencyCode: string;
  rate: number;
  note: string;
  status: TransferStatus;
  reference: string;
  createdAt: string;
};

export type ManagedCard = {
  id: string;
  name: string;
  network: 'Visa' | 'Mastercard';
  type: 'Virtual';
  last4: string;
  currency: string;
  spendLimit: string;
  spendLimitAmount: number;
  spendLimitCurrencyCode: string;
  monthlySpentAmount: number;
  monthlySpentDisplay: string;
  fundingSourceAccountId: string;
  fundingSourceLabel: string;
  fundingSourceBalanceDisplay: string;
  linkedBalanceLabel: string;
  usageNote: string;
  status: ManagedCardStatus;
  createdAt: string;
  recentActivity: ManagedCardActivity[];
};

export type ManagedCardActivityStatus = 'approved' | 'declined' | 'reversed';

export type ManagedCardActivity = {
  id: string;
  merchantName: string;
  description: string;
  amount: number;
  currencyCode: string;
  amountDisplay: string;
  status: ManagedCardActivityStatus;
  statusLabel: string;
  createdAt: string;
};

export type RecipientRecord = {
  id: string;
  name: string;
  subtitle: string;
  paymentType: 'bank' | 'international';
  bankName: string;
  destinationLabel: string;
  paymentId: string;
};

export type IncomeSortingCategoryId = 'salary' | 'client_income' | 'transfers';

export type IncomeSortingRule = {
  id: IncomeSortingCategoryId;
  label: string;
  allocationPercentage: number;
  destinationGoalId: string | null;
  enabled: boolean;
  accentColor: string;
};

export type IncomeSortingConfig = {
  enabled: boolean;
  currencyCode: string;
  minimumTriggerAmount: number;
  rules: IncomeSortingRule[];
  updatedAt: string;
};

export type AppActivityItem = {
  id: string;
  type: AppActivityType;
  title: string;
  subtitle: string;
  description: string;
  amount?: number;
  currencyCode?: string;
  createdAt: string;
  status: AppActivityStatus;
  statusLabel: string;
  tone: AppActivityTone;
  avatarText: string;
  avatarAccentColor: string;
  avatarTextColor?: string;
  linkedEntityId?: string;
  linkedEntityType?: AppActivityLinkedEntityType;
};

export type GoovaAppState = {
  accounts: AppAccount[];
  fundings: FundingTransaction[];
  transfers: TransferTransaction[];
  payments: PaymentRecord[];
  cards: ManagedCard[];
  savingsGoals: SavingsGoal[];
  incomeSorting: IncomeSortingConfig;
  activities: AppActivityItem[];
};
