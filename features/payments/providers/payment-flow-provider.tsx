import { createContext, type PropsWithChildren,useContext, useMemo, useState } from 'react';

import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { buildDraftFromPaymentRecord } from '@/services/payments-service';
import type {
  BankPaymentFormValues,
  InternationalPaymentFormValues,
  PaymentDraft,
  PaymentRecord,
  PaymentType,
} from '@/types/payments';

type PaymentFlowContextValue = {
  draft: PaymentDraft;
  recentPayments: PaymentRecord[];
  lastSubmittedPayment: PaymentRecord | null;
  startDraft: (type: PaymentType) => void;
  saveBankValues: (values: BankPaymentFormValues) => void;
  saveInternationalValues: (values: InternationalPaymentFormValues) => void;
  completePayment: (payment: PaymentRecord) => void;
  seedDraftFromPayment: (payment: PaymentRecord) => void;
  resetDraft: () => void;
  getPaymentById: (paymentId: string | undefined) => PaymentRecord | null;
};

const initialDraft: PaymentDraft = {
  type: null,
  bankValues: null,
  internationalValues: null,
};

const PaymentFlowContext = createContext<PaymentFlowContextValue | null>(null);

export function PaymentFlowProvider({ children }: PropsWithChildren) {
  const { addPaymentRecord, getPaymentById: getAppPaymentById, payments } = useGoovaAppState();
  const [draft, setDraft] = useState<PaymentDraft>(initialDraft);
  const [lastSubmittedPayment, setLastSubmittedPayment] = useState<PaymentRecord | null>(null);

  const value = useMemo<PaymentFlowContextValue>(
    () => ({
      draft,
      recentPayments: payments,
      lastSubmittedPayment,
      startDraft(type) {
        setDraft({
          type,
          bankValues: type === 'bank' ? draft.bankValues : null,
          internationalValues: type === 'international' ? draft.internationalValues : null,
        });
      },
      saveBankValues(values) {
        setDraft({
          type: 'bank',
          bankValues: values,
          internationalValues: null,
        });
      },
      saveInternationalValues(values) {
        setDraft({
          type: 'international',
          bankValues: null,
          internationalValues: values,
        });
      },
      completePayment(payment) {
        setLastSubmittedPayment(payment);
        addPaymentRecord(payment);
      },
      seedDraftFromPayment(payment) {
        setDraft(buildDraftFromPaymentRecord(payment));
      },
      resetDraft() {
        setDraft(initialDraft);
      },
      getPaymentById(paymentId) {
        return getAppPaymentById(paymentId);
      },
    }),
    [addPaymentRecord, draft, getAppPaymentById, lastSubmittedPayment, payments]
  );

  return <PaymentFlowContext.Provider value={value}>{children}</PaymentFlowContext.Provider>;
}

export function usePaymentFlow() {
  const context = useContext(PaymentFlowContext);

  if (!context) {
    throw new Error('usePaymentFlow must be used within PaymentFlowProvider.');
  }

  return context;
}
