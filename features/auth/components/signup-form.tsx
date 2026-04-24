import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Lock, Mail, Phone, ShieldCheck, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { Colors } from '@/constants/colors';
import { useSignupMutation } from '@/features/auth/hooks/use-auth';
import { signupSchema } from '@/features/auth/schemas/auth';
import { useOnboarding } from '@/hooks/use-onboarding';
import { toErrorMessage } from '@/lib/errors';
import type { SignupFormValues } from '@/types/auth';

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false);
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
        form.reset({ ...values, password: '', confirmPassword: '' });
      }
    } catch {
      return;
    }
  }

  return (
    <View style={styles.form}>
      {signupMutation.error && (
        <NoticeBanner
          message={toErrorMessage(signupMutation.error, 'Unable to create account.')}
          tone="error"
        />
      )}

      <Controller
        control={form.control}
        name="fullName"
        render={({ field, fieldState }) => (
          <AppInput
            label="Full name"
            leftIcon={<User size={18} color={Colors.primary} strokeWidth={2.5} />}
            placeholder="Alex Johnson"
            onChangeText={field.onChange}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <AppInput
                label="Email"
                leftIcon={<Mail size={16} color={Colors.primary} strokeWidth={2.5} />}
                placeholder="name@gcf.app"
                keyboardType="email-address"
                onChangeText={field.onChange}
                value={field.value}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
        <View style={styles.flex1}>
          <Controller
            control={form.control}
            name="phoneNumber"
            render={({ field, fieldState }) => (
              <AppInput
                label="Phone"
                leftIcon={<Phone size={16} color={Colors.primary} strokeWidth={2.5} />}
                placeholder="+234..."
                keyboardType="phone-pad"
                onChangeText={field.onChange}
                value={field.value}
                error={fieldState.error?.message}
              />
            )}
          />
        </View>
      </View>

      <Controller
        control={form.control}
        name="password"
        render={({ field, fieldState }) => (
          <AppInput
            label="Password"
            leftIcon={<Lock size={18} color={Colors.primary} strokeWidth={2.5} />}
            rightIcon={
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                {showPassword ? (
                  <EyeOff size={20} color="#999" />
                ) : (
                  <Eye size={20} color="#999" />
                )}
              </Pressable>
            }
            placeholder="Choose a secure password"
            secureTextEntry={!showPassword}
            helperText="At least 8 characters with symbols and numbers"
            onChangeText={field.onChange}
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
            label="Confirm password"
            leftIcon={<ShieldCheck size={18} color={Colors.primary} strokeWidth={2.5} />}
            placeholder="Re-enter your password"
            secureTextEntry={!showPassword}
            onChangeText={field.onChange}
            value={field.value}
            error={fieldState.error?.message}
          />
        )}
      />

      <Controller
        control={form.control}
        name="referralCode"
        render={({ field }) => (
          <AppInput
            label="Referral code"
            placeholder="GCF2026"
            onChangeText={field.onChange}
            value={field.value || ''}
          />
        )}
      />

      <View style={{ marginTop: 8 }}>
        <AppButton
          title="Create account"
          loading={signupMutation.isPending}
          onPress={form.handleSubmit(handleSignup)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
});
