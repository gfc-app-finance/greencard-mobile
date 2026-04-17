import type { User } from '@supabase/supabase-js';

import { Colors } from '@/constants/colors';
import { formatCurrencyAmount } from '@/lib/currency';
import { getUserFirstName, getUserInitials } from '@/lib/user';
import { getMockRecentPayments } from '@/services/payments-service';
import type {
  DashboardAccountSpendInsight,
  DashboardActivityPreviewItem,
  DashboardCurrencyWatchItem,
  DashboardQuickAction,
  DashboardSnapshot,
  SavingsGoal,
} from '@/types/dashboard';
import type {
  AccountStatus,
  AppAccount,
  AppActivityItem,
  AppActivityStatus,
  FundingTransaction,
  FundingTransactionStatus,
  GoovaAppState,
  IncomeSortingConfig,
  ManagedCard,
  ManagedCardStatus,
  PaymentProcessingStatus,
  RecipientRecord,
  TransferStatus,
  TransferTransaction,
} from '@/types/fintech';
import type { PaymentRecord, PaymentTimelineStep } from '@/types/payments';

const accountStatusLabels: Record<AccountStatus, string> = {
  pending: 'Pending',
  active: 'Active',
  restricted: 'Restricted',
};

const fundingStatusLabels: Record<FundingTransactionStatus, string> = {
  initiated: 'Initiated',
  pending: 'Pending',
  completed: 'Completed',
  failed: 'Failed',
};

const paymentStatusLabels: Record<PaymentProcessingStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const transferStatusLabels: Record<TransferStatus, string> = {
  initiated: 'Initiated',
  converting: 'Converting',
  completed: 'Completed',
  failed: 'Failed',
};

const managedCardStatusLabels: Record<ManagedCardStatus, string> = {
  pending: 'Pending setup',
  active: 'Active',
  frozen: 'Frozen',
  terminated: 'Terminated',
};

const quickActions: DashboardQuickAction[] = [
  {
    id: 'add-money',
    label: 'Add Money',
    iconName: 'plus',
    accentColor: Colors.primaryStrong,
  },
  {
    id: 'move-money',
    label: 'Move Money',
    iconName: 'shuffle',
    accentColor: Colors.secondary,
  },
  {
    id: 'details',
    label: 'Details',
    iconName: 'home',
    accentColor: Colors.text,
  },
  {
    id: 'more',
    label: 'More',
    iconName: 'more-horizontal',
    accentColor: Colors.violet,
  },
];

const spendTrendLabels = ['1', '5', '10', '15', '20', '25', '30'];
const spendTrendWeights = [0.14, 0.22, 0.34, 0.5, 0.68, 0.84, 1];
const spendTrendSeedByCurrency: Record<string, number[]> = {
  NGN: [12000, 17600, 23150, 28700, 34450, 39200, 43800],
  USD: [48, 86, 122, 164, 214, 271, 332],
  GBP: [42, 71, 106, 148, 191, 236, 298],
  EUR: [36, 58, 84, 118, 149, 183, 224],
};

const fxWatchSeed: {
  baseCurrencyCode: string;
  quoteCurrencyCode: string;
  rate: number;
  dailyChangePercentage: number;
}[] = [
  { baseCurrencyCode: 'EUR', quoteCurrencyCode: 'GBP', rate: 0.8688, dailyChangePercentage: -0.2 },
  { baseCurrencyCode: 'USD', quoteCurrencyCode: 'GBP', rate: 0.737, dailyChangePercentage: -0.43 },
  { baseCurrencyCode: 'GBP', quoteCurrencyCode: 'USD', rate: 1.3569, dailyChangePercentage: 0.31 },
  { baseCurrencyCode: 'EUR', quoteCurrencyCode: 'USD', rate: 1.1788, dailyChangePercentage: 0.14 },
  { baseCurrencyCode: 'USD', quoteCurrencyCode: 'EUR', rate: 0.8483, dailyChangePercentage: -0.12 },
  { baseCurrencyCode: 'GBP', quoteCurrencyCode: 'EUR', rate: 1.1511, dailyChangePercentage: 0.28 },
  { baseCurrencyCode: 'USD', quoteCurrencyCode: 'NGN', rate: 1540.3, dailyChangePercentage: 0.64 },
  { baseCurrencyCode: 'GBP', quoteCurrencyCode: 'NGN', rate: 2088.7, dailyChangePercentage: 0.58 },
  { baseCurrencyCode: 'EUR', quoteCurrencyCode: 'NGN', rate: 1813.4, dailyChangePercentage: 0.42 },
  { baseCurrencyCode: 'NGN', quoteCurrencyCode: 'USD', rate: 0.0006, dailyChangePercentage: -0.64 },
  { baseCurrencyCode: 'NGN', quoteCurrencyCode: 'GBP', rate: 0.0005, dailyChangePercentage: -0.58 },
  { baseCurrencyCode: 'NGN', quoteCurrencyCode: 'EUR', rate: 0.0006, dailyChangePercentage: -0.42 },
];

const savingsGoals: SavingsGoal[] = [
  {
    id: 'uk-masters',
    name: "UK Master's Fund",
    savedAmount: 'NGN 4,200,000',
    targetAmount: 'NGN 8,500,000',
    progressPercentage: 49,
    note: 'Auto-save every Friday with roundup boosts',
    cadenceLabel: 'Target for September intake',
    currencyCode: 'NGN',
    savedAmountValue: 4200000,
    targetAmountValue: 8500000,
    autoSaveAmountValue: 25000,
    autoSaveFrequency: 'weekly',
    targetDate: '2026-09-30T00:00:00.000Z',
    sourceAccountId: 'ngn',
  },
];

const incomeSortingSeed: IncomeSortingConfig = {
  enabled: true,
  currencyCode: 'GBP',
  minimumTriggerAmount: 50,
  updatedAt: '2026-04-14T01:13:00.000Z',
  rules: [
    {
      id: 'salary',
      label: 'Salary',
      allocationPercentage: 46,
      destinationGoalId: 'uk-masters',
      enabled: true,
      accentColor: Colors.primaryStrong,
    },
    {
      id: 'client_income',
      label: 'Client income',
      allocationPercentage: 34,
      destinationGoalId: null,
      enabled: true,
      accentColor: Colors.secondary,
    },
    {
      id: 'transfers',
      label: 'Transfers',
      allocationPercentage: 20,
      destinationGoalId: null,
      enabled: true,
      accentColor: Colors.violet,
    },
  ],
};

const cards: ManagedCard[] = [];

function toActivityDate(dateTime: string) {
  return new Date(dateTime).getTime();
}

function sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort((left, right) => toActivityDate(right.createdAt) - toActivityDate(left.createdAt));
}

function formatSignedCurrencyAmount(currencyCode: string, amount: number) {
  const absoluteAmount = formatCurrencyAmount(currencyCode, Math.abs(amount));

  if (amount > 0) {
    return `+${absoluteAmount}`;
  }

  if (amount < 0) {
    return `-${absoluteAmount}`;
  }

  return absoluteAmount;
}

function formatFxWatchRate(currencyCode: string, value: number) {
  const fractionDigits = value >= 100 ? 2 : 4;

  return new Intl.NumberFormat('en-GB', {
    currency: currencyCode,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
    style: 'currency',
  }).format(value);
}

function formatDailyChangePercentage(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function getAccountStatusLabel(status: AccountStatus) {
  return accountStatusLabels[status];
}

export function getFundingStatusLabel(status: FundingTransactionStatus) {
  return fundingStatusLabels[status];
}

export function getPaymentProcessingStatusLabel(status: PaymentProcessingStatus) {
  return paymentStatusLabels[status];
}

export function getTransferStatusLabel(status: TransferStatus) {
  return transferStatusLabels[status];
}

export function getManagedCardStatusLabel(status: ManagedCardStatus) {
  return managedCardStatusLabels[status];
}

export function getActivityStatusLabel(status: AppActivityStatus) {
  if (status in fundingStatusLabels) {
    return fundingStatusLabels[status as FundingTransactionStatus];
  }

  if (status in paymentStatusLabels) {
    return paymentStatusLabels[status as PaymentProcessingStatus];
  }

  if (status in transferStatusLabels) {
    return transferStatusLabels[status as TransferStatus];
  }

  return accountStatusLabels[status as AccountStatus];
}

export function getActivityStatusTone(status: AppActivityStatus) {
  if (status === 'completed' || status === 'active') {
    return 'success' as const;
  }

  if (status === 'failed' || status === 'restricted') {
    return 'danger' as const;
  }

  if (status === 'under_review' || status === 'pending') {
    return 'warning' as const;
  }

  if (status === 'processing' || status === 'converting') {
    return 'violet' as const;
  }

  return 'info' as const;
}

type TimelineTemplateStep = {
  id: string;
  label: string;
  description: string;
  offsetMinutes: number;
};

const fundingTimelineTemplates: Record<'active' | 'failed', TimelineTemplateStep[]> = {
  active: [
    {
      id: 'initiated',
      label: 'Initiated',
      description: 'The funding instruction has been created.',
      offsetMinutes: 0,
    },
    {
      id: 'pending',
      label: 'Pending',
      description: 'We are confirming the incoming funds from your funding source.',
      offsetMinutes: 5,
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Funds are now available in your account balance.',
      offsetMinutes: 18,
    },
  ],
  failed: [
    {
      id: 'initiated',
      label: 'Initiated',
      description: 'The funding instruction has been created.',
      offsetMinutes: 0,
    },
    {
      id: 'pending',
      label: 'Pending',
      description: 'We are confirming the incoming funds from your funding source.',
      offsetMinutes: 5,
    },
    {
      id: 'failed',
      label: 'Failed',
      description: 'The funding could not be completed and needs attention.',
      offsetMinutes: 12,
    },
  ],
};

const transferTimelineTemplates: Record<'active' | 'failed', TimelineTemplateStep[]> = {
  active: [
    {
      id: 'initiated',
      label: 'Initiated',
      description: 'Your conversion instruction has been submitted.',
      offsetMinutes: 0,
    },
    {
      id: 'converting',
      label: 'Converting',
      description: 'Funds are being moved through the FX route.',
      offsetMinutes: 4,
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Converted funds are now in the destination account.',
      offsetMinutes: 16,
    },
  ],
  failed: [
    {
      id: 'initiated',
      label: 'Initiated',
      description: 'Your conversion instruction has been submitted.',
      offsetMinutes: 0,
    },
    {
      id: 'converting',
      label: 'Converting',
      description: 'Funds are being moved through the FX route.',
      offsetMinutes: 4,
    },
    {
      id: 'failed',
      label: 'Failed',
      description: 'The transfer was interrupted before completion.',
      offsetMinutes: 10,
    },
  ],
};

function formatTimelineTimestamp(date: Date, offsetMinutes: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(date.getTime() + offsetMinutes * 60 * 1000));
}

function buildTimelineFromTemplates(
  status: string,
  createdAt: string,
  templates: TimelineTemplateStep[]
): PaymentTimelineStep[] {
  const createdDate = new Date(createdAt);
  const currentIndex = templates.findIndex((step) => step.id === status);
  const resolvedCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  return templates.map((step, index) => {
    const isCompleted = index < resolvedCurrentIndex;
    const isCurrent = index === resolvedCurrentIndex;

    return {
      id: step.id,
      label: step.label,
      description: step.description,
      timestamp: isCompleted || isCurrent ? formatTimelineTimestamp(createdDate, step.offsetMinutes) : '',
      state: isCompleted ? 'completed' : isCurrent ? 'current' : 'pending',
    };
  });
}

export function buildFundingTimeline(status: FundingTransactionStatus, createdAt: string) {
  const templates = status === 'failed' ? fundingTimelineTemplates.failed : fundingTimelineTemplates.active;
  return buildTimelineFromTemplates(status, createdAt, templates);
}

export function buildTransferTimeline(status: TransferStatus, createdAt: string) {
  const templates = status === 'failed' ? transferTimelineTemplates.failed : transferTimelineTemplates.active;
  return buildTimelineFromTemplates(status, createdAt, templates);
}

function buildAccountSeeds(): AppAccount[] {
  return [
    {
      id: 'ngn',
      accountType: 'Personal',
      currencyCode: 'NGN',
      currencyLabel: 'Nigerian Naira',
      displayName: 'GCF NGN Account',
      balance: 12480,
      availableBalance: 12480,
      maskedBalance: 'NGN **,***,***.**',
      balanceNote: 'Your main local balance for daily transfers and collections.',
      accountNumber: '1029384756',
      providerName: 'Providus Bank',
      status: 'active',
      summaryNote: 'Transfers, collections, and local settlements are active today.',
      changeLabel: 'Primary wallet',
      selectorHint: 'Local account ready',
      accentColor: Colors.primaryStrong,
      accentSoftColor: Colors.primarySoft,
      actionLabel: 'Accounts',
      fundingSourceLabel: 'Providus Bank - NGN',
      minimumAddMoney: 'NGN 5,000 minimum',
      addMoneyQuickAmounts: ['NGN 10,000', 'NGN 25,000', 'NGN 50,000', 'NGN 100,000'],
      moveMoneyQuickAmounts: ['NGN 25,000', 'NGN 50,000', 'NGN 75,000', 'NGN 100,000'],
      detailsSections: [
        {
          id: 'local',
          title: 'For local transfers only',
          description: 'Use these details to receive Naira transfers inside Nigeria.',
          items: [
            { id: 'beneficiary', label: 'Beneficiary', value: 'Sodiq Ojodu' },
            { id: 'bank', label: 'Bank', value: 'Providus Bank' },
            { id: 'account-number', label: 'Account number', value: '1029384756' },
            {
              id: 'reference',
              label: 'Reference',
              value: 'Use your GCF tag for faster matching',
            },
          ],
        },
        {
          id: 'international',
          title: 'For international receipts',
          description: 'International settlement details for verified business and freelance income.',
          items: [
            { id: 'beneficiary-intl', label: 'Beneficiary', value: 'GCF Customer Holding' },
            { id: 'provider-intl', label: 'Provider', value: 'GCF Settlement Rail' },
            {
              id: 'memo-intl',
              label: 'Reference note',
              value: 'Share your customer memo before payout',
            },
          ],
        },
      ],
      safeguardingNote:
        'Your Naira balance is safeguarded with licensed partner banks and regulated payment infrastructure.',
      shareDetailsText:
        'GCF NGN Account\nBeneficiary: Sodiq Ojodu\nBank: Providus Bank\nAccount number: 1029384756',
    },
    {
      id: 'usd',
      accountType: 'Personal',
      currencyCode: 'USD',
      currencyLabel: 'US Dollar',
      displayName: 'GCF USD Account',
      balance: 3240.12,
      availableBalance: 3240.12,
      maskedBalance: 'USD *,***.**',
      balanceNote: 'Receive client payments and hold USD in one place.',
      accountNumber: 'ACH routing ending 4821',
      providerName: 'Lead Bank Partner',
      status: 'active',
      summaryNote: 'ACH and wire receiving details are ready for international clients.',
      changeLabel: '+2.4% this month',
      selectorHint: 'Receiving details ready',
      accentColor: Colors.primary,
      accentSoftColor: 'rgba(31, 168, 154, 0.12)',
      actionLabel: 'Accounts',
      fundingSourceLabel: 'Lead Bank Partner - USD',
      minimumAddMoney: 'USD 10 minimum',
      addMoneyQuickAmounts: ['USD 20', 'USD 50', 'USD 100', 'USD 250'],
      moveMoneyQuickAmounts: ['USD 10', 'USD 20', 'USD 50', 'USD 100'],
      detailsSections: [
        {
          id: 'local',
          title: 'For domestic USD receipts',
          description: 'Use these details for ACH and local U.S. transfers.',
          items: [
            { id: 'beneficiary', label: 'Beneficiary', value: 'Sodiq Ojodu' },
            { id: 'routing', label: 'Routing number', value: '021000021' },
            { id: 'account-number', label: 'Account number', value: '0004821' },
            { id: 'bank', label: 'Bank', value: 'Lead Bank Partner' },
          ],
        },
        {
          id: 'international',
          title: 'For international USD wires',
          description: 'Wire instructions for clients sending USD from abroad.',
          items: [
            { id: 'beneficiary-wire', label: 'Beneficiary', value: 'GCF FBO Sodiq Ojodu' },
            { id: 'swift-wire', label: 'SWIFT', value: 'LEADUS33' },
            {
              id: 'address-wire',
              label: 'Bank address',
              value: '1801 Main St, Kansas City, Missouri, United States',
            },
          ],
        },
      ],
      safeguardingNote:
        'USD balances are safeguarded via licensed banking partners and remain separated from Greencard operating funds.',
      shareDetailsText:
        'GCF USD Account\nBeneficiary: Sodiq Ojodu\nRouting number: 021000021\nAccount number: 0004821\nBank: Lead Bank Partner',
    },
    {
      id: 'gbp',
      accountType: 'Personal',
      currencyCode: 'GBP',
      currencyLabel: 'British Pound',
      displayName: 'GCF GBP Account',
      balance: 1180.4,
      availableBalance: 1180.4,
      maskedBalance: 'GBP *,***.**',
      balanceNote: 'Keep GBP balances ready for tuition and UK-based payouts.',
      accountNumber: 'Sort code reference ending 2718',
      providerName: 'UK Local Rails',
      status: 'active',
      summaryNote: '',
      changeLabel: 'Local details enabled',
      selectorHint: '1 pending inbound payment',
      accentColor: Colors.secondary,
      accentSoftColor: 'rgba(217, 164, 65, 0.14)',
      actionLabel: 'Accounts',
      fundingSourceLabel: 'Nationwide - GBP',
      minimumAddMoney: 'GBP 10 minimum',
      addMoneyQuickAmounts: ['GBP 50', 'GBP 200', 'GBP 300', 'GBP 400'],
      moveMoneyQuickAmounts: ['GBP 10', 'GBP 20', 'GBP 50', 'GBP 100'],
      detailsSections: [
        {
          id: 'local',
          title: 'For domestic transfers only',
          description: 'Use these details for Faster Payments and local U.K. transfers.',
          items: [
            { id: 'beneficiary', label: 'Beneficiary', value: 'Sodiq Ojodu' },
            { id: 'sort-code', label: 'Sort code', value: '04-00-75' },
            { id: 'account-number', label: 'Account number', value: '67400361' },
            {
              id: 'address',
              label: 'Address',
              value: 'Revolut Ltd, 30 South Colonnade, London, United Kingdom',
            },
          ],
        },
        {
          id: 'international',
          title: 'For international GBP wires',
          description: 'Wire this account when sending GBP from outside the U.K.',
          items: [
            { id: 'beneficiary-wire', label: 'Beneficiary', value: 'Sodiq Ojodu' },
            { id: 'swift-wire', label: 'BIC / SWIFT', value: 'REVOGB21' },
            { id: 'iban-wire', label: 'IBAN', value: 'GB82REVO04007567400361' },
          ],
        },
      ],
      safeguardingNote:
        'Your GBP balance is held with regulated partners and ring-fenced from Greencard operational funds.',
      shareDetailsText:
        'GCF GBP Account\nBeneficiary: Sodiq Ojodu\nSort code: 04-00-75\nAccount number: 67400361\nBank: Nationwide',
    },
    {
      id: 'eur',
      accountType: 'Personal',
      currencyCode: 'EUR',
      currencyLabel: 'Euro Wallet',
      displayName: 'GCF EUR Account',
      balance: 640.9,
      availableBalance: 640.9,
      maskedBalance: 'EUR ***.**',
      balanceNote: 'Hold EUR for planned transfers and card funding.',
      accountNumber: 'IBAN reference ending 9044',
      providerName: 'SEPA Collection Rail',
      status: 'active',
      summaryNote: 'SEPA-friendly receiving details are available whenever you need them.',
      changeLabel: 'Virtual IBAN available',
      selectorHint: 'Ready when you need it',
      accentColor: Colors.violet,
      accentSoftColor: Colors.violetSoft,
      actionLabel: 'Accounts',
      fundingSourceLabel: 'SEPA Rail - EUR',
      minimumAddMoney: 'EUR 10 minimum',
      addMoneyQuickAmounts: ['EUR 20', 'EUR 50', 'EUR 100', 'EUR 250'],
      moveMoneyQuickAmounts: ['EUR 10', 'EUR 20', 'EUR 50', 'EUR 100'],
      detailsSections: [
        {
          id: 'local',
          title: 'For SEPA transfers only',
          description: 'Use these details for domestic EUR and SEPA receipts.',
          items: [
            { id: 'beneficiary', label: 'Beneficiary', value: 'Sodiq Ojodu' },
            { id: 'iban', label: 'IBAN', value: 'DE12987654000123456789' },
            { id: 'bank', label: 'Bank', value: 'SEPA Collection Rail' },
            {
              id: 'reference',
              label: 'Reference',
              value: 'Use your unique GCF memo for matching',
            },
          ],
        },
        {
          id: 'international',
          title: 'For international EUR wires',
          description: 'Additional wire guidance for non-SEPA senders.',
          items: [
            {
              id: 'beneficiary-wire',
              label: 'Beneficiary',
              value: 'Greencard EUR FBO Sodiq Ojodu',
            },
            { id: 'swift-wire', label: 'BIC / SWIFT', value: 'SEPAGB2L' },
            {
              id: 'address-wire',
              label: 'Provider address',
              value: 'Rue du Commerce 12, Brussels, Belgium',
            },
          ],
        },
      ],
      safeguardingNote:
        'EUR balances are held in safeguarded partner accounts and protected by regulated settlement arrangements.',
      shareDetailsText:
        'GCF EUR Account\nBeneficiary: Sodiq Ojodu\nIBAN: DE12987654000123456789\nProvider: SEPA Collection Rail',
    },
  ];
}

function buildFundingSeeds(accounts: AppAccount[]): FundingTransaction[] {
  const ngnAccount = accounts.find((account) => account.id === 'ngn') || accounts[0];
  const usdAccount = accounts.find((account) => account.id === 'usd') || accounts[0];

  return [
    {
      id: 'funding_seed_1',
      accountId: ngnAccount.id,
      accountLabel: ngnAccount.displayName,
      amount: 50000,
      currencyCode: 'NGN',
      fundingSourceLabel: ngnAccount.fundingSourceLabel,
      status: 'completed',
      reference: 'GCF-FUND-NGN-50K',
      createdAt: '2026-04-13T16:22:00.000Z',
    },
    {
      id: 'funding_seed_2',
      accountId: usdAccount.id,
      accountLabel: usdAccount.displayName,
      amount: 250,
      currencyCode: 'USD',
      fundingSourceLabel: usdAccount.fundingSourceLabel,
      status: 'pending',
      reference: 'GCF-FUND-USD-250',
      createdAt: '2026-04-14T06:45:00.000Z',
    },
  ];
}

function buildTransferSeeds(accounts: AppAccount[]): TransferTransaction[] {
  const usdAccount = accounts.find((account) => account.id === 'usd') || accounts[0];
  const gbpAccount = accounts.find((account) => account.id === 'gbp') || accounts[0];

  return [
    {
      id: 'transfer_seed_1',
      sourceAccountId: usdAccount.id,
      sourceAccountLabel: usdAccount.displayName,
      destinationAccountId: gbpAccount.id,
      destinationAccountLabel: gbpAccount.displayName,
      sourceAmount: 100,
      sourceCurrencyCode: 'USD',
      destinationAmount: 74.13,
      destinationCurrencyCode: 'GBP',
      rate: 0.7413,
      note: 'Tuition budget top-up',
      status: 'completed',
      reference: 'GCF-FX-USDGBP-7413',
      createdAt: '2026-04-12T10:12:00.000Z',
    },
  ];
}

function buildAccountActivities(accounts: AppAccount[]): AppActivityItem[] {
  return [
    {
      id: 'activity_account_ngn',
      type: 'account',
      title: 'NGN account created',
      subtitle: 'Local collections and settlements enabled',
      description: 'Your local NGN account is active and ready for funding.',
      createdAt: '2026-04-10T08:00:00.000Z',
      status: accounts[0]?.status || 'active',
      statusLabel: getAccountStatusLabel(accounts[0]?.status || 'active'),
      tone: 'neutral',
      avatarText: 'NG',
      avatarAccentColor: Colors.primarySoft,
      linkedEntityId: accounts[0]?.id,
      linkedEntityType: 'account',
    },
  ];
}

export function buildPaymentActivity(payment: PaymentRecord): AppActivityItem {
  return {
    id: `activity_${payment.id}`,
    type: 'payment',
    title: `Sent ${payment.displayAmount} to ${payment.recipientName}`,
    subtitle: `${payment.typeLabel} - ${payment.destinationLabel}`,
    description: `Payment to ${payment.recipientBankName}`,
    amount: payment.amount,
    currencyCode: payment.currencyCode,
    createdAt: payment.createdAt,
    status: payment.status,
    statusLabel: payment.statusLabel,
    tone: 'negative',
    avatarText: payment.avatarText,
    avatarAccentColor: payment.avatarColor,
    linkedEntityId: payment.id,
    linkedEntityType: 'payment',
  };
}

export function buildFundingActivity(funding: FundingTransaction): AppActivityItem {
  return {
    id: `activity_${funding.id}`,
    type: 'funding',
    title: `Added ${formatCurrencyAmount(funding.currencyCode, funding.amount)} to ${funding.currencyCode} account`,
    subtitle: funding.accountLabel,
    description: `Funding source: ${funding.fundingSourceLabel}`,
    amount: funding.amount,
    currencyCode: funding.currencyCode,
    createdAt: funding.createdAt,
    status: funding.status,
    statusLabel: getFundingStatusLabel(funding.status),
    tone: 'positive',
    avatarText: funding.currencyCode,
      avatarAccentColor: 'rgba(43, 182, 115, 0.14)',
    linkedEntityId: funding.id,
    linkedEntityType: 'funding',
  };
}

export function buildTransferActivity(transfer: TransferTransaction): AppActivityItem {
  return {
    id: `activity_${transfer.id}`,
    type: 'transfer',
    title: `Converted ${formatCurrencyAmount(transfer.sourceCurrencyCode, transfer.sourceAmount)} to ${transfer.destinationCurrencyCode}`,
    subtitle: `${transfer.sourceAccountLabel} -> ${transfer.destinationAccountLabel}`,
    description: `FX rate ${transfer.rate.toFixed(4)} with ${transfer.note || 'internal transfer'}`,
    amount: transfer.sourceAmount,
    currencyCode: transfer.sourceCurrencyCode,
    createdAt: transfer.createdAt,
    status: transfer.status,
    statusLabel: getTransferStatusLabel(transfer.status),
    tone: 'neutral',
    avatarText: `${transfer.sourceCurrencyCode[0]}${transfer.destinationCurrencyCode[0]}`,
    avatarAccentColor: Colors.violetSoft,
    linkedEntityId: transfer.id,
    linkedEntityType: 'transfer',
  };
}

export function buildCardActivity(card: ManagedCard, createdAt = new Date().toISOString()): AppActivityItem {
  const activityStatus = card.status === 'pending' ? 'pending' : 'active';

  return {
    id: `activity_${card.id}_${createdAt}`,
    type: 'card',
    title: `${card.name} card created`,
    subtitle: `${card.type} ${card.network} ending ${card.last4}`,
    description: 'Card controls are live for international online spend.',
    createdAt,
    status: activityStatus,
    statusLabel: getManagedCardStatusLabel(card.status),
    tone: 'neutral',
    avatarText: 'CD',
    avatarAccentColor: 'rgba(217, 164, 65, 0.14)',
    linkedEntityId: card.id,
    linkedEntityType: 'card',
  };
}

function buildInitialActivities(
  accounts: AppAccount[],
  fundings: FundingTransaction[],
  transfers: TransferTransaction[],
  payments: PaymentRecord[]
) {
  return sortByCreatedAtDesc([
    ...payments.map(buildPaymentActivity),
    ...fundings.map(buildFundingActivity),
    ...transfers.map(buildTransferActivity),
    ...buildAccountActivities(accounts),
  ]);
}

export function createInitialGoovaAppState(payments = getMockRecentPayments()): GoovaAppState {
  const accounts = buildAccountSeeds();
  const fundings = buildFundingSeeds(accounts);
  const transfers = buildTransferSeeds(accounts);

  return {
    accounts,
    fundings,
    transfers,
    payments,
    cards,
    savingsGoals,
    incomeSorting: incomeSortingSeed,
    activities: buildInitialActivities(accounts, fundings, transfers, payments),
  };
}

export function buildDashboardAccount(account: AppAccount) {
  return {
    ...account,
    balanceValue: account.availableBalance,
    balance: formatCurrencyAmount(account.currencyCode, account.availableBalance),
    statusLabel: getAccountStatusLabel(account.status),
  };
}

export function buildDashboardActivityPreviewItem(item: AppActivityItem): DashboardActivityPreviewItem {
  return {
    id: item.id,
    title: item.title,
    subtitle: item.subtitle,
    meta: `${formatActivityListTimestamp(item.createdAt)} - ${item.statusLabel}`,
    amount: item.amount && item.currencyCode ? formatCurrencyAmount(item.currencyCode, item.amount) : item.statusLabel,
    tone: item.tone === 'positive' ? 'positive' : 'negative',
    avatarText: item.avatarText,
    avatarAccentColor: item.avatarAccentColor,
    avatarTextColor: item.avatarTextColor,
  };
}

function buildDashboardSpendInsights(
  accounts: AppAccount[],
  payments: PaymentRecord[],
  transfers: TransferTransaction[]
): DashboardAccountSpendInsight[] {
  return accounts.map((account) => {
    const outgoingPayments = payments.filter(
      (payment) => payment.sourceAccountId === account.id && payment.direction === 'sent'
    );
    const outgoingTransfers = transfers.filter(
      (transfer) => transfer.sourceAccountId === account.id
    );
    const dynamicSpend =
      outgoingPayments.reduce((total, payment) => total + payment.amount, 0) +
      outgoingTransfers.reduce((total, transfer) => total + transfer.sourceAmount, 0);
    const seedSeries =
      spendTrendSeedByCurrency[account.currencyCode] ||
      spendTrendLabels.map((_, index) => (index + 1) * 20);
    const trendSeries = seedSeries.map((point, index) =>
      Number((point + dynamicSpend * spendTrendWeights[index]).toFixed(2))
    );
    const totalSpentAmount = trendSeries[trendSeries.length - 1] || 0;
    const baselinePreviousMonth = seedSeries[seedSeries.length - 1] * 0.88;
    const monthlyDeltaAmount = totalSpentAmount - baselinePreviousMonth;

    return {
      accountId: account.id,
      accountLabel: account.displayName,
      currencyCode: account.currencyCode,
      totalSpentAmount,
      totalSpentDisplay: formatCurrencyAmount(account.currencyCode, totalSpentAmount),
      monthlyDeltaAmount,
      monthlyDeltaDisplay: formatSignedCurrencyAmount(
        account.currencyCode,
        monthlyDeltaAmount
      ),
      monthlyDeltaDirection:
        monthlyDeltaAmount > 0 ? 'up' : monthlyDeltaAmount < 0 ? 'down' : 'flat',
      trendSeries,
      trendLabels: spendTrendLabels,
      outgoingPaymentsCount: outgoingPayments.length,
      transferCount: outgoingTransfers.length,
    };
  });
}

function buildDashboardCurrencyWatchlist(
  accounts: AppAccount[]
): DashboardCurrencyWatchItem[] {
  const accountByCurrency = new Map(
    accounts.map((account) => [account.currencyCode, account.currencyLabel])
  );

  return fxWatchSeed
    .filter(
      (item) =>
        accountByCurrency.has(item.baseCurrencyCode) &&
        accountByCurrency.has(item.quoteCurrencyCode)
    )
    .map((item) => ({
      id: `${item.baseCurrencyCode}-${item.quoteCurrencyCode}`,
      baseCurrencyCode: item.baseCurrencyCode,
      baseCurrencyLabel:
        accountByCurrency.get(item.baseCurrencyCode) || item.baseCurrencyCode,
      quoteCurrencyCode: item.quoteCurrencyCode,
      quoteCurrencyLabel:
        accountByCurrency.get(item.quoteCurrencyCode) || item.quoteCurrencyCode,
      rate: item.rate,
      displayRate: formatFxWatchRate(item.quoteCurrencyCode, item.rate),
      dailyChangePercentage: item.dailyChangePercentage,
      dailyChangeDisplay: formatDailyChangePercentage(item.dailyChangePercentage),
      direction:
        item.dailyChangePercentage > 0
          ? 'up'
          : item.dailyChangePercentage < 0
            ? 'down'
            : 'flat',
    }));
}

export function buildHomeDashboardSnapshot(
  user: User | null | undefined,
  state: GoovaAppState
): DashboardSnapshot {
  const firstName = getUserFirstName(user);

  return {
    greetingName: firstName,
    avatarInitials: getUserInitials(user),
    defaultAccountId: 'ngn',
    accounts: state.accounts.map(buildDashboardAccount),
    quickActions,
    savingsGoals: state.savingsGoals,
    reminder: {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Provide details as part of regulatory requirements and unlock higher limits.',
      actionLabel: 'Get started',
    },
    activityPreview: state.activities.slice(0, 3).map(buildDashboardActivityPreviewItem),
    spendInsights: buildDashboardSpendInsights(
      state.accounts,
      state.payments,
      state.transfers
    ),
    currencyWatchlist: buildDashboardCurrencyWatchlist(state.accounts),
  };
}

export function buildRecipientsFromPayments(payments: PaymentRecord[]): RecipientRecord[] {
  const seen = new Set<string>();

  return payments
    .map((payment) => ({
      id: payment.id,
      name: payment.recipientName,
      subtitle: `${payment.recipientBankName} - ${payment.destinationLabel}`,
      paymentType: payment.type,
      bankName: payment.recipientBankName,
      destinationLabel: payment.destinationLabel,
      paymentId: payment.id,
    }))
    .filter((recipient) => {
      const key = `${recipient.name}-${recipient.paymentType}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

export function formatActivityListTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}
