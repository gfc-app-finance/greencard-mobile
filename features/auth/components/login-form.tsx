import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Spacing } from '@/constants/theme';
import { useLoginMutation } from '@/features/auth/hooks/use-auth';
import { loginSchema } from '@/features/auth/schemas/auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { toErrorMessage } from '@/lib/errors';
import type { LoginFormValues } from '@/types/auth';

export function LoginForm() {
  const loginMutation = useLoginMutation();
  const { clearPostOnboardingRoute } = useOnboarding();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function handleLogin(values: LoginFormValues) {
    try {
      await loginMutation.mutateAsync(values);
      clearPostOnboardingRoute();
    } catch {
      return;
    }
  }

  return (
    <View style={styles.form}>
      {loginMutation.error ? (
        <NoticeBanner
          message={toErrorMessage(loginMutation.error, 'Unable to log in right now.')}
          tone="error"
        />
      ) : null}

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
        name="password"
        render={({ field, fieldState }) => (
          <AppInput
            autoCapitalize="none"
            autoCorrect={false}
            label="Password"
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholder="Enter your password"
            secureTextEntry
            textContentType="password"
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <AppButton
        title="Log in"
        loading={loginMutation.isPending}
        onPress={form.handleSubmit(handleLogin)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.md,
  },
});
