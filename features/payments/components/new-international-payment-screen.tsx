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
  getPaymentDestinationById,
  paymentDestinationOptions,
} from '@/services/payments-service';
import type { InternationalPaymentFormValues, PaymentDestinationId } from '@/types/payments';

import { usePaymentFlow } from '../providers/payment-flow-provider';
import { internationalPaymentSchema } from '../schemas/payment';
import { PaymentDestinationSelector } from './payment-destination-selector';
import { PaymentOptionSheet } from './payment-option-sheet';
import { PaymentSelectField } from './payment-select-field';
import { PaymentToggleRow } from './payment-toggle-row';

type InternationalSheetTarget = 'currency' | 'source' | null;

function getSelectedOptionLabel(
  options: { id: string; label: string }[],
  selectedId: string | undefined
) {
  return options.find((option) => option.id === selectedId)?.label || '';
}

export function NewInternationalPaymentScreen() {
  const router = useRouter();
  const { dashboard, isLoading } = useHomeDashboard();
  const { access, profile } = useVerification();
  const { draft, saveInternationalValues } = usePaymentFlow();
  const [activeSheet, setActiveSheet] = useState<InternationalSheetTarget>(null);
  const form = useForm<InternationalPaymentFormValues>({
    resolver: zodResolver(internationalPaymentSchema),
    defaultValues: {
      destinationId: 'uk',
      recipientFullName: '',
      recipientBankName: '',
      routingValueOne: '',
      routingValueTwo: '',
      amount: '',
      currencyCode: '',
      note: '',
      sourceAccountId: '',
      saveRecipient: true,
    },
  });

  const selectedDestinationId = form.watch('destinationId');
  const selectedDestination = getPaymentDestinationById(selectedDestinationId as PaymentDestinationId);
  const selectedSourceAccountId = form.watch('sourceAccountId');
  const selectedCurrencyCode = form.watch('currencyCode');

  useEffect(() => {
    if (!dashboard) {
      return;
    }

    const defaultDestinationId = (draft.internationalValues?.destinationId || 'uk') as PaymentDestinationId;
    const destination = getPaymentDestinationById(defaultDestinationId);
    const defaultSourceAccountId =
      draft.internationalValues?.sourceAccountId ||
      dashboard.defaultAccountId ||
      dashboard.accounts[0]?.id ||
      '';
    const defaultCurrencyCode =
      draft.internationalValues?.currencyCode ||
      destination.supportedCurrencyCodes[0] ||
      dashboard.accounts[0]?.currencyCode ||
      '';

    form.reset({
      destinationId: defaultDestinationId,
      recipientFullName: draft.internationalValues?.recipientFullName || '',
      recipientBankName: draft.internationalValues?.recipientBankName || '',
      routingValueOne: draft.internationalValues?.routingValueOne || '',
      routingValueTwo: draft.internationalValues?.routingValueTwo || '',
      amount: draft.internationalValues?.amount || '',
      currencyCode: defaultCurrencyCode,
      note: draft.internationalValues?.note || '',
      sourceAccountId: defaultSourceAccountId,
      saveRecipient: draft.internationalValues?.saveRecipient ?? true,
    });
  }, [dashboard, draft.internationalValues, form]);

  const sourceAccountOptions = useMemo(
    () => (dashboard ? buildSourceAccountOptions(dashboard.accounts) : []),
    [dashboard]
  );

  const currencyOptions = useMemo(
    () =>
      dashboard
        ? buildCurrencyOptions(dashboard.accounts, selectedDestination.supportedCurrencyCodes)
        : [],
    [dashboard, selectedDestination.supportedCurrencyCodes]
  );

  useEffect(() => {
    if (!currencyOptions.length) {
      return;
    }

    if (!currencyOptions.some((option) => option.id === selectedCurrencyCode)) {
      form.setValue('currencyCode', currencyOptions[0].id, { shouldDirty: true });
    }
  }, [currencyOptions, form, selectedCurrencyCode]);

  const selectedSourceAccount = dashboard?.accounts.find(
    (account) => account.id === selectedSourceAccountId
  );

  const handleContinue = (values: InternationalPaymentFormValues) => {
    const secondaryField = selectedDestination.routingFields[1];

    if (secondaryField && !values.routingValueTwo.trim()) {
      form.setError('routingValueTwo', {
        message: `${secondaryField.label} is required for ${selectedDestination.label}.`,
      });
      return;
    }

    saveInternationalValues(values);
    router.push('/payments/review' as never);
  };

  if (isLoading || !dashboard) {
    return (
      <AppScreen scrollable={false} withTabBarOffset={false}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Preparing international payment flow...</Text>
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
          subtitle="Select a destination, add recipient details, and review before sending."
          title="International payment"
        />

        <NoticeBanner
          message="Destination-specific routing details are shown below and can be adjusted before review."
          tone="info"
        />

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Destination</Text>
          <PaymentDestinationSelector
            onSelect={(destinationId) =>
              form.setValue('destinationId', destinationId, { shouldDirty: true, shouldValidate: true })
            }
            options={paymentDestinationOptions}
            selectedId={selectedDestination.id}
          />
          <Text style={styles.destinationHint}>
            {selectedDestination.description} - {selectedDestination.arrivalLabel}
          </Text>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recipient details</Text>

          <Controller
            control={form.control}
            name="recipientFullName"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                label="Recipient full name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Ariana Hughes"
                value={field.value}
              />
            )}
          />

          <Controller
            control={form.control}
            name="recipientBankName"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                label="Recipient bank name"
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Revolut Business"
                value={field.value}
              />
            )}
          />

          <Controller
            control={form.control}
            name="routingValueOne"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                helperText={selectedDestination.routingFields[0]?.helperText}
                keyboardType={selectedDestination.routingFields[0]?.keyboardType}
                label={selectedDestination.routingFields[0]?.label || 'Primary routing detail'}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder={selectedDestination.routingFields[0]?.placeholder || 'Enter detail'}
                value={field.value}
              />
            )}
          />

          <Controller
            control={form.control}
            name="routingValueTwo"
            render={({ field, fieldState }) => (
              <AppInput
                error={fieldState.error?.message}
                helperText={selectedDestination.routingFields[1]?.helperText}
                keyboardType={selectedDestination.routingFields[1]?.keyboardType}
                label={selectedDestination.routingFields[1]?.label || 'Secondary routing detail'}
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder={selectedDestination.routingFields[1]?.placeholder || 'Enter detail'}
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
                placeholder="1250"
                value={field.value}
              />
            )}
          />

          <PaymentSelectField
            error={form.formState.errors.currencyCode?.message}
            helperText={`Supported for ${selectedDestination.countryLabel}.`}
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
                label="Payment purpose / note"
                multiline
                onBlur={field.onBlur}
                onChangeText={field.onChange}
                placeholder="Vendor settlement for April shipment"
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
              description="Save this international beneficiary for future transfers."
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
  destinationHint: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
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
