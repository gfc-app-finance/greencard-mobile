import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { PremiumScreenHeader } from '@/features/home/components/premium-screen-header';
import { useHomeDashboard } from '@/features/home/hooks/use-home-dashboard';
import { LockedFeatureState } from '@/features/verification/components/locked-feature-state';
import { getVerificationJourneyRoute } from '@/features/verification/verification-access';
import { useVerification } from '@/hooks/use-verification';
import {
  buildCurrencyOptions,
  buildSourceAccountOptions,
  paymentBankOptions,
} from '@/services/payments-service';
import type { BankPaymentFormValues } from '@/types/payments';

import { usePaymentFlow } from '../providers/payment-flow-provider';
import { bankPaymentSchema } from '../schemas/payment';
import { PaymentOptionSheet } from './payment-option-sheet';
import { PaymentSelectField } from './payment-select-field';
import { PaymentToggleRow } from './payment-toggle-row';

type BankSheetTarget = 'bank' | 'currency' | 'source' | null;

function getSelectedOptionLabel(
  options: { id: string; label: string }[],
  selectedId: string | undefined,
  fallback?: string
) {
  return options.find((option) => option.id === selectedId)?.label || fallback || '';
}

export function NewBankPaymentScreen() {
  const router = useRouter();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, profile } = useVerification();
  const { draft, saveBankValues } = usePaymentFlow();
  const [activeSheet, setActiveSheet] = useState<BankSheetTarget>(null);
  const form = useForm<BankPaymentFormValues>({
    resolver: zodResolver(bankPaymentSchema),
    defaultValues: {
      recipientBankId: '',
      recipientBankName: '',
      recipientAccountNumber: '',
      recipientAccountName: '',
      amount: '',
      currencyCode: '',
      note: '',
      sourceAccountId: '',
      saveRecipient: true,
    },
  });

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const defaultSourceAccountId =
      draft.bankValues?.sourceAccountId || dashboard.defaultAccountId || dashboard.accounts[0]?.id || '';
    const defaultCurrencyCode =
      draft.bankValues?.currencyCode ||
      dashboard.accounts.find((account) => account.id === defaultSourceAccountId)?.currencyCode ||
      dashboard.accounts[0]?.currencyCode ||
      '';

    form.reset({
      recipientBankId: draft.bankValues?.recipientBankId || '',
      recipientBankName: draft.bankValues?.recipientBankName || '',
      recipientAccountNumber: draft.bankValues?.recipientAccountNumber || '',
      recipientAccountName: draft.bankValues?.recipientAccountName || '',
      amount: draft.bankValues?.amount || '',
      currencyCode: defaultCurrencyCode,
      note: draft.bankValues?.note || '',
      sourceAccountId: defaultSourceAccountId,
      saveRecipient: draft.bankValues?.saveRecipient ?? true,
    });
  }, [dashboard, draft.bankValues, form]);

  const bankOptions = useMemo(
    () =>
      paymentBankOptions.map((bank) => ({
        id: bank.id,
        label: bank.name,
        description: `Mock beneficiary lookup - ${bank.shortCode}`,
      })),
    []
  );

  const sourceAccountOptions = useMemo(
    () => (dashboard ? buildSourceAccountOptions(dashboard.accounts) : []),
    [dashboard]
  );

  const currencyOptions = useMemo(
    () => (dashboard ? buildCurrencyOptions(dashboard.accounts) : []),
    [dashboard]
  );

  const selectedBankId = form.watch('recipientBankId');
  const selectedSourceAccountId = form.watch('sourceAccountId');
  const selectedCurrencyCode = form.watch('currencyCode');
  const selectedSourceAccount = dashboard?.accounts.find(
    (account) => account.id === selectedSourceAccountId
  );

  const handleContinue = (values: BankPaymentFormValues) => {
    saveBankValues(values);
    router.push('/payments/review' as never);
  };

  if (isLoading || !dashboard) {
    return (
      <AppScreen scrollable={false} withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Preparing bank payment flow...</Text>
        </View>
      </AppScreen>
    );
  }

  if (!access.canUseFullPaymentFlow) {
    return (
      <AppScreen withTabBarOffset={false}>
        <LockedFeatureState
          feature="send_payment"
          onBack={() => router.back()}
          onVerifyNow={() =>
            router.push(getVerificationJourneyRoute(profile) as never)
          }
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen keyboardAware withTabBarOffset={false}>
      <View style={styles.form}>
        <PremiumScreenHeader
          onBackPress={() => router.back()}
          subtitle="Set up a local bank transfer with verified beneficiary details."
          title="New bank payment"
        />

        <NoticeBanner
          message="Use a verified beneficiary name and bank account number before continuing."
          tone="info"
        />

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recipient details</Text>

          <PaymentSelectField
            error={form.formState.errors.recipientBankId?.message}
            label="Recipient bank"
            onPress={() => setActiveSheet('bank')}
            placeholder="Choose recipient bank"
            value={getSelectedOptionLabel(bankOptions, selectedBankId, form.watch('recipientBankName'))}
          />

          <Controller
            control={form.control}
            name="recipientAccountNumber"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                keyboardType="number-pad"
                label="Recipient account number"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="1029384756"
                value={field.value}
              />
            )}
          />

          <Controller
            control={form.control}
            name="recipientAccountName"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                label="Recipient account name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Sodiq Ojodu"
                value={field.value}
              />
            )}
          />
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Transfer details</Text>

          <Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                keyboardType="decimal-pad"
                label="Amount"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="2500"
                value={field.value}
              />
            )}
          />

          <PaymentSelectField
            error={form.formState.errors.currencyCode?.message}
            helperText="Choose the payout currency for this bank transfer."
            label="Currency"
            onPress={() => setActiveSheet('currency')}
            placeholder="Choose payout currency"
            value={getSelectedOptionLabel(currencyOptions, selectedCurrencyCode)}
          />

          <PaymentSelectField
            error={form.formState.errors.sourceAccountId?.message}
            helperText={
              selectedSourceAccount
                ? `${selectedSourceAccount.balance} available in this source account.`
                : undefined
            }
            label="Source account"
            onPress={() => setActiveSheet('source')}
            placeholder="Choose source account"
            value={getSelectedOptionLabel(sourceAccountOptions, selectedSourceAccountId)}
          />

          <Controller
            control={form.control}
            name="note"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                label="Payment note / narration"
                multiline
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Invoice 104 settlement"
                value={field.value}
              />
            )}
          />
        </AppCard>

        <Controller
          control={form.control}
          name="saveRecipient"
          render={({ field }) => (
            <PaymentToggleRow
              description="Keep this bank beneficiary handy for future local payments."
              onValueChange={field.onChange}
              title="Save recipient"
              value={field.value}
            />
          )}
        />

        <AppButton onPress={form.handleSubmit(handleContinue)} title="Continue to review" />
      </View>

      <PaymentOptionSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(optionId) => {
          const matchedBank = paymentBankOptions.find((bank) => bank.id === optionId);
          form.setValue('recipientBankId', optionId, { shouldValidate: true });
          form.setValue('recipientBankName', matchedBank?.name || '', { shouldValidate: true });
        }}
        options={bankOptions}
        selectedId={selectedBankId}
        title="Select recipient bank"
        visible={activeSheet === 'bank'}
      />

      <PaymentOptionSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(optionId) =>
          form.setValue('currencyCode', optionId, { shouldDirty: true, shouldValidate: true })
        }
        options={currencyOptions}
        selectedId={selectedCurrencyCode}
        title="Select payout currency"
        visible={activeSheet === 'currency'}
      />

      <PaymentOptionSheet
        onClose={() => setActiveSheet(null)}
        onSelect={(optionId) =>
          form.setValue('sourceAccountId', optionId, { shouldDirty: true, shouldValidate: true })
        }
        options={sourceAccountOptions}
        selectedId={selectedSourceAccountId}
        title="Choose source account"
        visible={activeSheet === 'source'}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
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
});
