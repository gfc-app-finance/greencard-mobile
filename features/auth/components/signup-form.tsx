import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Spacing } from '@/constants/theme';
import { useSignupMutation } from '@/features/auth/hooks/use-auth';
import { signupSchema } from '@/features/auth/schemas/auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { toErrorMessage } from '@/lib/errors';
import type { SignupFormValues } from '@/types/auth';

export function SignupForm() {
  const signupMutation = useSignupMutation();
  const { clearPostOnboardingRoute } = useOnboarding();
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      referralCode: '',
    },
  });

  async function handleSignup(values: SignupFormValues) {
    try {
      const result = await signupMutation.mutateAsync(values);
      clearPostOnboardingRoute();

      if (result.needsEmailConfirmation) {
        form.reset({
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          password: '',
          confirmPassword: '',
          referralCode: values.referralCode || '',
        });
      }
    } catch {
      return;
    }
  }

  return (
    <View style={styles.form}>
      {signupMutation.error ? (
        <NoticeBanner
          message={toErrorMessage(signupMutation.error, 'Unable to create your account right now.')}
          tone="error"
        />
      ) : null}

      {signupMutation.data?.message ? (
        <NoticeBanner
          message={signupMutation.data.message}
          tone={signupMutation.data.needsEmailConfirmation ? 'success' : 'info'}
        />
      ) : null}

      <Controller
        control={form.control}
        name="fullName"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="words"
            autoCorrect={false}
            label="Full name"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Alex Johnson"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            label="Email"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="name@gcf.app"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="phoneNumber"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            label="Phone number"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="+234 800 123 4567"
            textContentType="telephoneNumber"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="none"
            autoCorrect={false}
            helperText="Use at least 8 characters."
            label="Password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Create a secure password"
            secureTextEntry
            textContentType="newPassword"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="none"
            autoCorrect={false}
            label="Confirm password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Re-enter your password"
            secureTextEntry
            textContentType="newPassword"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="referralCode"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="characters"
            autoCorrect={false}
            helperText="Optional"
            label="Referral code"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="GCF2026"
            value={field.value || ''}
            error={fieldState.error?.message}
          />
        )}
      />

      <AppButton
        title="Create account"
        loading={signupMutation.isPending}
        onPress={form.handleSubmit(handleSignup)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
});
