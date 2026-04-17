import { Colors } from '@/constants/colors';
import { formatCurrencyAmount, parseCurrencyAmount } from '@/lib/currency';
import type { DashboardAccount } from '@/types/dashboard';
import type {
  BankPaymentFormValues,
  InternationalPaymentFormValues,
  PaymentBankOption,
  PaymentDestinationId,
  PaymentDestinationOption,
  PaymentDraft,
  PaymentFieldOption,
  PaymentMethodOption,
  PaymentRecord,
  PaymentReviewModel,
  PaymentStatus,
  PaymentTimelineStep,
  PaymentType,
} from '@/types/payments';

const paymentStatusLabels: Record<PaymentStatus, string> = {
  submitted: 'Submitted',
  under_review: 'Under review',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

const paymentTimelineTemplates: Record<'active' | 'failed', {
  id: string;
  label: string;
  description: string;
  offsetMinutes: number;
}[]> = {
  active: [
    {
      id: 'submitted',
      label: 'Submitted',
      description: 'Your payment instruction has been created.',
      offsetMinutes: 0,
    },
    {
      id: 'under_review',
      label: 'Under review',
      description: 'We are validating the recipient and transfer details.',
      offsetMinutes: 8,
    },
    {
      id: 'processing',
      label: 'Processing',
      description: 'Your payment is moving through the settlement rail.',
      offsetMinutes: 24,
    },
    {
      id: 'completed',
      label: 'Completed',
      description: 'Funds have reached the receiving bank.',
      offsetMinutes: 55,
    },
  ],
  failed: [
    {
      id: 'submitted',
      label: 'Submitted',
      description: 'Your payment instruction has been created.',
      offsetMinutes: 0,
    },
    {
      id: 'under_review',
      label: 'Under review',
      description: 'We are validating the recipient and transfer details.',
      offsetMinutes: 8,
    },
    {
      id: 'processing',
      label: 'Processing',
      description: 'Your payment is moving through the settlement rail.',
      offsetMinutes: 24,
    },
    {
      id: 'failed',
      label: 'Failed',
      description: 'The payment could not be completed and needs attention.',
      offsetMinutes: 30,
    },
  ],
} as const;

const mockAvatarColors = [
  '#1FA89A',
  '#5F7682',
  '#D9A441',
  '#D96C6C',
  '#2BB673',
  '#7D9099',
] as const;

export const paymentMethodOptions: PaymentMethodOption[] = [
  {
    id: 'bank',
    title: 'Pay by Bank',
    description: 'Local bank transfer with recipient bank details and narration.',
    accentLabel: 'Local rails',
    iconName: 'briefcase',
  },
  {
    id: 'international',
    title: 'Pay Internationally',
    description: 'Cross-border payment with destination-aware recipient details.',
    accentLabel: 'Global transfer',
    iconName: 'globe',
  },
];

export const paymentBankOptions: PaymentBankOption[] = [
  { id: 'providus', name: 'Providus Bank', shortCode: 'PRV' },
  { id: 'gtbank', name: 'Guaranty Trust Bank', shortCode: 'GTB' },
  { id: 'access', name: 'Access Bank', shortCode: 'ACS' },
  { id: 'zenith', name: 'Zenith Bank', shortCode: 'ZTH' },
  { id: 'firstbank', name: 'First Bank of Nigeria', shortCode: 'FBN' },
  { id: 'uba', name: 'United Bank for Africa', shortCode: 'UBA' },
];

export const paymentDestinationOptions: PaymentDestinationOption[] = [
  {
    id: 'uk',
    label: 'United Kingdom',
    countryLabel: 'United Kingdom',
    description: 'Faster Payments and U.K. beneficiary accounts.',
    accentLabel: 'GBP route',
    supportedCurrencyCodes: ['GBP', 'USD'],
    feeAmount: 0,
    arrivalLabel: 'Usually within minutes',
    routingFields: [
      {
        id: 'routingValueOne',
        label: 'Account number',
        placeholder: '50713263',
        keyboardType: 'number-pad',
      },
      {
        id: 'routingValueTwo',
        label: 'Sort code',
        placeholder: '09-01-28',
        keyboardType: 'number-pad',
      },
    ],
  },
  {
    id: 'us',
    label: 'United States',
    countryLabel: 'United States',
    description: 'ACH and domestic U.S. payouts.',
    accentLabel: 'USD route',
    supportedCurrencyCodes: ['USD'],
    feeAmount: 6.5,
    arrivalLabel: 'Same day for eligible routes',
    routingFields: [
      {
        id: 'routingValueOne',
        label: 'Account number',
        placeholder: '0004821',
        keyboardType: 'number-pad',
      },
      {
        id: 'routingValueTwo',
        label: 'Routing number',
        placeholder: '021000021',
        keyboardType: 'number-pad',
      },
    ],
  },
  {
    id: 'europe',
    label: 'Europe',
    countryLabel: 'Europe',
    description: 'SEPA and Euro account payouts.',
    accentLabel: 'EUR route',
    supportedCurrencyCodes: ['EUR', 'USD'],
    feeAmount: 4.5,
    arrivalLabel: 'Same day on SEPA-supported accounts',
    routingFields: [
      {
        id: 'routingValueOne',
        label: 'IBAN',
        placeholder: 'DE12987654000123456789',
      },
      {
        id: 'routingValueTwo',
        label: 'BIC / SWIFT',
        placeholder: 'REVOGB21',
      },
    ],
  },
  {
    id: 'canada',
    label: 'Canada',
    countryLabel: 'Canada',
    description: 'Canadian beneficiary details with local identifiers.',
    accentLabel: 'North America',
    supportedCurrencyCodes: ['USD', 'GBP'],
    feeAmount: 8,
    arrivalLabel: 'Usually same day',
    routingFields: [
      {
        id: 'routingValueOne',
        label: 'Account number',
        placeholder: '00472851',
        keyboardType: 'number-pad',
      },
      {
        id: 'routingValueTwo',
        label: 'Transit / institution number',
        placeholder: '00412-003',
      },
    ],
  },
  {
    id: 'other',
    label: 'Other supported destinations',
    countryLabel: 'Other supported destinations',
    description: 'Use for approved corridors that require bank and SWIFT details.',
    accentLabel: 'Manual checks',
    supportedCurrencyCodes: ['USD', 'EUR', 'GBP'],
    feeAmount: 12,
    arrivalLabel: 'Usually within 1 business day',
    routingFields: [
      {
        id: 'routingValueOne',
        label: 'IBAN or account number',
        placeholder: 'Enter beneficiary account detail',
      },
      {
        id: 'routingValueTwo',
        label: 'SWIFT / bank code',
        placeholder: 'Enter SWIFT or bank code',
      },
    ],
  },
];

const mockRecentPaymentSeeds: {
  id: string;
  type: PaymentType;
  recipientName: string;
  recipientBankName: string;
  recipientDetails: string[];
  destinationLabel: string;
  amount: number;
  currencyCode: string;
  feeAmount: number;
  fxRateLabel?: string;
  note: string;
  sourceAccountId: string;
  sourceAccountLabel: string;
  status: PaymentStatus;
  createdAt: string;
}[] = [
  {
    id: 'pmt_seed_1',
    type: 'bank',
    recipientName: 'Sodiq Ojodu',
    recipientBankName: 'Providus Bank',
    recipientDetails: ['Account name: Sodiq Ojodu', 'Account number: 1029384756'],
    destinationLabel: 'Nigeria',
    amount: 100,
    currencyCode: 'GBP',
    feeAmount: 0,
    fxRateLabel: undefined,
    note: 'Rent support',
    sourceAccountId: 'gbp',
    sourceAccountLabel: 'GCF GBP Account',
    status: 'completed',
    createdAt: '2026-04-14T00:20:00.000Z',
  },
  {
    id: 'pmt_seed_2',
    type: 'international',
    recipientName: 'Even Logistics and Cleaning',
    recipientBankName: 'Revolut Business',
    recipientDetails: ['IBAN: DE12987654000123456789', 'BIC: REVOGB21'],
    destinationLabel: 'Europe',
    amount: 30,
    currencyCode: 'GBP',
    feeAmount: 4.5,
    fxRateLabel: '1 GBP = EUR 1.18',
    note: 'Supplier top-up',
    sourceAccountId: 'gbp',
    sourceAccountLabel: 'GCF GBP Account',
    status: 'processing',
    createdAt: '2026-03-29T11:10:00.000Z',
  },
  {
    id: 'pmt_seed_3',
    type: 'bank',
    recipientName: 'Ndubuisi James Osuji',
    recipientBankName: 'Bank of America',
    recipientDetails: ['Account number: 0004821', 'Routing number: 021000021'],
    destinationLabel: 'United States',
    amount: 351.08,
    currencyCode: 'USD',
    feeAmount: 6.5,
    fxRateLabel: undefined,
    note: 'Consulting disbursement',
    sourceAccountId: 'usd',
    sourceAccountLabel: 'GCF USD Account',
    status: 'under_review',
    createdAt: '2026-02-24T15:05:00.000Z',
  },
  {
    id: 'pmt_seed_4',
    type: 'international',
    recipientName: 'A Francis Meclin',
    recipientBankName: 'State Bank of India',
    recipientDetails: ['Account number: 39800993067', 'SWIFT: SBININBB'],
    destinationLabel: 'Other supported destinations',
    amount: 8500,
    currencyCode: 'NGN',
    feeAmount: 12,
    fxRateLabel: '1 USD = NGN 1,540',
    note: 'Project milestone',
    sourceAccountId: 'usd',
    sourceAccountLabel: 'GCF USD Account',
    status: 'submitted',
    createdAt: '2026-01-22T09:16:00.000Z',
  },
];

function formatTimelineTimestamp(date: Date, offsetMinutes: number) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(date.getTime() + offsetMinutes * 60 * 1000));
}

export function buildPaymentTimeline(status: PaymentStatus, createdAt: string) {
  const templates = status === 'failed' ? paymentTimelineTemplates.failed : paymentTimelineTemplates.active;
  const createdDate = new Date(createdAt);
  const currentIndex = templates.findIndex((item) => item.id === status);
  const resolvedCurrentIndex = currentIndex === -1 ? 0 : currentIndex;

  return templates.map((item, index): PaymentTimelineStep => {
    const isCompleted = index < resolvedCurrentIndex;
    const isCurrent = index === resolvedCurrentIndex;

    return {
      id: item.id,
      label: item.label,
      description: item.description,
      timestamp:
        isCompleted || isCurrent ? formatTimelineTimestamp(createdDate, item.offsetMinutes) : '',
      state: isCompleted ? 'completed' : isCurrent ? 'current' : 'pending',
    };
  });
}

function getStatusLabel(status: PaymentStatus) {
  return paymentStatusLabels[status];
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  return paymentStatusLabels[status];
}

function getAvatarText(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function getAvatarColor(seed: string) {
  const total = seed.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return mockAvatarColors[total % mockAvatarColors.length];
}

function buildRecordFromSeed(seed: (typeof mockRecentPaymentSeeds)[number]): PaymentRecord {
  const amountDisplay = formatCurrencyAmount(seed.currencyCode, seed.amount);
  const totalPayableDisplay = formatCurrencyAmount(seed.currencyCode, seed.amount + seed.feeAmount);

  return {
    id: seed.id,
    type: seed.type,
    typeLabel: seed.type === 'bank' ? 'Pay by Bank' : 'Pay Internationally',
    destinationLabel: seed.destinationLabel,
    direction: 'sent',
    recipientName: seed.recipientName,
    recipientBankName: seed.recipientBankName,
    recipientDetails: seed.recipientDetails,
    amount: seed.amount,
    currencyCode: seed.currencyCode,
    displayAmount: amountDisplay,
    feeAmount: seed.feeAmount,
    feeDisplay: seed.feeAmount ? formatCurrencyAmount(seed.currencyCode, seed.feeAmount) : 'Free',
    fxRateLabel: seed.fxRateLabel,
    totalPayableDisplay,
    note: seed.note,
    sourceAccountId: seed.sourceAccountId,
    sourceAccountLabel: seed.sourceAccountLabel,
    status: seed.status,
    statusLabel: getStatusLabel(seed.status),
    reference: buildPaymentReference(seed.id),
    createdAt: seed.createdAt,
    timeline: buildPaymentTimeline(seed.status, seed.createdAt),
    avatarText: getAvatarText(seed.recipientName),
    avatarColor: getAvatarColor(seed.recipientName),
  };
}

export function getMockRecentPayments() {
  return mockRecentPaymentSeeds.map(buildRecordFromSeed);
}

export function getPaymentDestinationById(destinationId: PaymentDestinationId) {
  return paymentDestinationOptions.find((option) => option.id === destinationId) || paymentDestinationOptions[0];
}

export function buildSourceAccountOptions(accounts: DashboardAccount[]): PaymentFieldOption[] {
  return accounts.map((account) => ({
    id: account.id,
    label: account.displayName,
    description: `${account.currencyCode} balance - ${account.balance}`,
    accentLabel: account.currencyCode,
  }));
}

export function buildCurrencyOptions(
  accounts: DashboardAccount[],
  supportedCurrencyCodes?: string[]
) {
  const uniqueCodes = accounts
    .filter((account) =>
      supportedCurrencyCodes ? supportedCurrencyCodes.includes(account.currencyCode) : true
    )
    .map((account) => account.currencyCode)
    .filter((currencyCode, index, list) => list.indexOf(currencyCode) === index);

  return uniqueCodes.map((currencyCode) => ({
    id: currencyCode,
    label: currencyCode,
    description: supportedCurrencyCodes
      ? `Payouts available in ${currencyCode}`
      : `Transfer in ${currencyCode}`,
  }));
}

function extractDetailValue(detail: string | undefined) {
  if (!detail) {
    return '';
  }

  const separatorIndex = detail.indexOf(':');

  if (separatorIndex === -1) {
    return detail.trim();
  }

  return detail.slice(separatorIndex + 1).trim();
}

function getBankOptionIdByName(bankName: string) {
  const lowerBankName = bankName.trim().toLowerCase();

  return (
    paymentBankOptions.find((bank) => bank.name.trim().toLowerCase() === lowerBankName)?.id ||
    paymentBankOptions.find((bank) => lowerBankName.includes(bank.name.trim().toLowerCase()))?.id ||
    ''
  );
}

function getDestinationIdByLabel(destinationLabel: string): PaymentDestinationId {
  const lowerLabel = destinationLabel.trim().toLowerCase();

  if (lowerLabel.includes('kingdom') || lowerLabel.includes('uk')) {
    return 'uk';
  }

  if (lowerLabel.includes('states') || lowerLabel.includes('usa') || lowerLabel.includes('us')) {
    return 'us';
  }

  if (lowerLabel.includes('europe') || lowerLabel.includes('sepa')) {
    return 'europe';
  }

  if (lowerLabel.includes('canada')) {
    return 'canada';
  }

  return 'other';
}

export function buildDraftFromPaymentRecord(payment: PaymentRecord): PaymentDraft {
  if (payment.type === 'bank') {
    const accountNumberDetail =
      payment.recipientDetails.find((detail) => detail.toLowerCase().includes('account number')) ||
      payment.recipientDetails[0] ||
      '';

    return {
      type: 'bank',
      bankValues: {
        recipientBankId: getBankOptionIdByName(payment.recipientBankName),
        recipientBankName: payment.recipientBankName,
        recipientAccountNumber: extractDetailValue(accountNumberDetail),
        recipientAccountName: payment.recipientName,
        amount: String(payment.amount),
        currencyCode: payment.currencyCode,
        note: payment.note,
        sourceAccountId: payment.sourceAccountId,
        saveRecipient: true,
      },
      internationalValues: null,
    };
  }

  const destinationId = getDestinationIdByLabel(payment.destinationLabel);

  return {
    type: 'international',
    bankValues: null,
    internationalValues: {
      destinationId,
      recipientFullName: payment.recipientName,
      recipientBankName: payment.recipientBankName,
      routingValueOne: extractDetailValue(payment.recipientDetails[0]),
      routingValueTwo: extractDetailValue(payment.recipientDetails[1]),
      amount: String(payment.amount),
      currencyCode: payment.currencyCode,
      note: payment.note,
      sourceAccountId: payment.sourceAccountId,
      saveRecipient: true,
    },
  };
}

function getSelectedSourceAccount(accounts: DashboardAccount[], sourceAccountId: string) {
  return accounts.find((account) => account.id === sourceAccountId) || accounts[0];
}

function buildFeeDisplay(currencyCode: string, feeAmount: number) {
  return feeAmount ? formatCurrencyAmount(currencyCode, feeAmount) : 'Free';
}

function buildFxRateLabel(sourceAccount: DashboardAccount, payoutCurrencyCode: string) {
  if (sourceAccount.currencyCode === payoutCurrencyCode) {
    return undefined;
  }

  const mockRates: Record<string, Record<string, number>> = {
    USD: { GBP: 0.74, EUR: 0.92, NGN: 1540 },
    GBP: { USD: 1.35, EUR: 1.23, NGN: 2078 },
    EUR: { USD: 1.08, GBP: 0.81, NGN: 1678 },
    NGN: { USD: 0.00065, GBP: 0.00048, EUR: 0.00059 },
  };

  const rate = mockRates[sourceAccount.currencyCode]?.[payoutCurrencyCode];

  if (!rate) {
    return undefined;
  }

  return `1 ${sourceAccount.currencyCode} = ${formatCurrencyAmount(payoutCurrencyCode, rate)}`;
}

export function buildBankPaymentReviewModel(
  values: BankPaymentFormValues,
  accounts: DashboardAccount[]
): PaymentReviewModel {
  const sourceAccount = getSelectedSourceAccount(accounts, values.sourceAccountId);
  const amount = parseCurrencyAmount(values.amount);
  const feeAmount = sourceAccount.currencyCode === values.currencyCode ? 0 : 3.5;
  const amountDisplay = formatCurrencyAmount(values.currencyCode, amount);

  return {
    type: 'bank',
    typeLabel: 'Pay by Bank',
    destinationLabel: 'Local bank transfer',
    recipientName: values.recipientAccountName,
    recipientBankName: values.recipientBankName,
    recipientDetails: [
      `Bank: ${values.recipientBankName}`,
      `Account number: ${values.recipientAccountNumber}`,
    ],
    amount,
    amountDisplay,
    currencyCode: values.currencyCode,
    feeAmount,
    feeDisplay: buildFeeDisplay(values.currencyCode, feeAmount),
    fxRateLabel: buildFxRateLabel(sourceAccount, values.currencyCode),
    totalPayableDisplay: formatCurrencyAmount(values.currencyCode, amount + feeAmount),
    note: values.note.trim(),
    sourceAccountId: sourceAccount.id,
    sourceAccountLabel: sourceAccount.displayName,
  };
}

export function buildInternationalPaymentReviewModel(
  values: InternationalPaymentFormValues,
  accounts: DashboardAccount[]
): PaymentReviewModel {
  const sourceAccount = getSelectedSourceAccount(accounts, values.sourceAccountId);
  const destination = getPaymentDestinationById(values.destinationId);
  const amount = parseCurrencyAmount(values.amount);
  const amountDisplay = formatCurrencyAmount(values.currencyCode, amount);

  return {
    type: 'international',
    typeLabel: 'Pay Internationally',
    destinationLabel: destination.label,
    recipientName: values.recipientFullName,
    recipientBankName: values.recipientBankName,
    recipientDetails: [
      `${destination.routingFields[0]?.label}: ${values.routingValueOne}`,
      destination.routingFields[1]?.label && values.routingValueTwo
        ? `${destination.routingFields[1].label}: ${values.routingValueTwo}`
        : `Destination: ${destination.countryLabel}`,
    ].filter(Boolean) as string[],
    amount,
    amountDisplay,
    currencyCode: values.currencyCode,
    feeAmount: destination.feeAmount,
    feeDisplay: buildFeeDisplay(values.currencyCode, destination.feeAmount),
    fxRateLabel: buildFxRateLabel(sourceAccount, values.currencyCode),
    totalPayableDisplay: formatCurrencyAmount(values.currencyCode, amount + destination.feeAmount),
    note: values.note.trim(),
    sourceAccountId: sourceAccount.id,
    sourceAccountLabel: sourceAccount.displayName,
  };
}

export function buildPaymentReference(seed: string) {
  const compactSeed = seed.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase();
  return `GCF-${compactSeed || 'PAYMENT'}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function createPaymentRecordFromReview(
  review: PaymentReviewModel,
  createdAt = new Date().toISOString()
): PaymentRecord {
  const seed = `${review.type}-${review.recipientName}-${createdAt}`;

  return {
    id: `payment_${Date.now()}`,
    type: review.type,
    typeLabel: review.typeLabel,
    destinationLabel: review.destinationLabel,
    direction: 'sent',
    recipientName: review.recipientName,
    recipientBankName: review.recipientBankName,
    recipientDetails: review.recipientDetails,
    amount: review.amount,
    currencyCode: review.currencyCode,
    displayAmount: review.amountDisplay,
    feeAmount: review.feeAmount,
    feeDisplay: review.feeDisplay,
    fxRateLabel: review.fxRateLabel,
    totalPayableDisplay: review.totalPayableDisplay,
    note: review.note,
    sourceAccountId: review.sourceAccountId,
    sourceAccountLabel: review.sourceAccountLabel,
    status: 'submitted',
    statusLabel: getStatusLabel('submitted'),
    reference: buildPaymentReference(seed),
    createdAt,
    timeline: buildPaymentTimeline('submitted', createdAt),
    avatarText: getAvatarText(review.recipientName),
    avatarColor: getAvatarColor(review.recipientName),
  };
}

export function formatPaymentListDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatPaymentSuccessDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function getPaymentTypeAccentColor(paymentType: PaymentRecord['type']) {
  return paymentType === 'bank' ? Colors.primaryStrong : Colors.secondary;
}
