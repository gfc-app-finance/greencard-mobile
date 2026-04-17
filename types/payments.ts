import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { KeyboardTypeOptions } from 'react-native';

import type { PaymentProcessingStatus } from './fintech';

export type PaymentType = 'bank' | 'international';

export type PaymentStatus = PaymentProcessingStatus;

export type PaymentDirection = 'sent' | 'received';

export type PaymentListFilter = 'all' | PaymentType;

export type PaymentMethodOption = {
  id: PaymentType;
  title: string;
  description: string;
  accentLabel: string;
  iconName: ComponentProps<typeof Feather>['name'];
};

export type PaymentDestinationId = 'uk' | 'us' | 'europe' | 'canada' | 'other';

export type PaymentRoutingField = {
  id: 'routingValueOne' | 'routingValueTwo';
  label: string;
  placeholder: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
};

export type PaymentDestinationOption = {
  id: PaymentDestinationId;
  label: string;
  countryLabel: string;
  description: string;
  accentLabel: string;
  supportedCurrencyCodes: string[];
  feeAmount: number;
  arrivalLabel: string;
  routingFields: PaymentRoutingField[];
};

export type PaymentBankOption = {
  id: string;
  name: string;
  shortCode: string;
};

export type PaymentFieldOption = {
  id: string;
  label: string;
  description?: string;
  accentLabel?: string;
};

export type BankPaymentFormValues = {
  recipientBankId: string;
  recipientBankName: string;
  recipientAccountNumber: string;
  recipientAccountName: string;
  amount: string;
  currencyCode: string;
  note: string;
  sourceAccountId: string;
  saveRecipient: boolean;
};

export type InternationalPaymentFormValues = {
  destinationId: PaymentDestinationId;
  recipientFullName: string;
  recipientBankName: string;
  routingValueOne: string;
  routingValueTwo: string;
  amount: string;
  currencyCode: string;
  note: string;
  sourceAccountId: string;
  saveRecipient: boolean;
};

export type PaymentDraft = {
  type: PaymentType | null;
  bankValues: BankPaymentFormValues | null;
  internationalValues: InternationalPaymentFormValues | null;
};

export type PaymentTimelineStep = {
  id: string;
  label: string;
  description: string;
  timestamp: string;
  state: 'completed' | 'current' | 'pending';
};

export type PaymentRecord = {
  id: string;
  type: PaymentType;
  typeLabel: string;
  destinationLabel: string;
  direction: PaymentDirection;
  recipientName: string;
  recipientBankName: string;
  recipientDetails: string[];
  amount: number;
  currencyCode: string;
  displayAmount: string;
  feeAmount: number;
  feeDisplay: string;
  fxRateLabel?: string;
  totalPayableDisplay: string;
  note: string;
  sourceAccountId: string;
  sourceAccountLabel: string;
  status: PaymentStatus;
  statusLabel: string;
  reference: string;
  createdAt: string;
  timeline: PaymentTimelineStep[];
  avatarText: string;
  avatarColor: string;
};

export type PaymentReviewModel = {
  type: PaymentType;
  typeLabel: string;
  destinationLabel: string;
  recipientName: string;
  recipientBankName: string;
  recipientDetails: string[];
  amount: number;
  amountDisplay: string;
  currencyCode: string;
  feeAmount: number;
  feeDisplay: string;
  fxRateLabel?: string;
  totalPayableDisplay: string;
  note: string;
  sourceAccountId: string;
  sourceAccountLabel: string;
};
