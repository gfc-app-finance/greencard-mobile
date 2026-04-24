import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { useLoginMutation } from '@/features/auth/hooks/use-auth';
import { loginSchema } from '@/features/auth/schemas/auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { toErrorMessage } from '@/lib/errors';
import type { LoginFormValues } from '@/types/auth';

export function LoginForm() {
  // NAMED EXPORT
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLoginMutation();
  const { clearPostOnboardingRoute } = useOnboarding();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
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
      {loginMutation.error && (
        <NoticeBanner
          message={toErrorMessage(loginMutation.error, 'Unable to log in.')}
          tone="error"
        />
      )}

      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <AppInput
            label=""
            leftIcon={<Mail size={20} color={Colors.primary} strokeWidth={2.5} />}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Enter your email"
            onChangeText={field.onChange}
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
            label=""
            leftIcon={<Lock size={20} color={Colors.primary} strokeWidth={2.5} />}
            rightIcon={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                {showPassword ? (
                  <EyeOff size={20} color="#9CA3AF" />
                ) : (
                  <Eye size={20} color="#9CA3AF" />
                )}
              </Pressable>
            }
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            onChangeText={field.onChange}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <View style={{ marginTop: 12 }}>
        <AppButton
          title="Log in"
          loading={loginMutation.isPending}
          onPress={form.handleSubmit(handleLogin)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
});
