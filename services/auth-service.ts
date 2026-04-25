import type { EmailOtpType, MobileOtpType, Session, User } from '@supabase/supabase-js';

import {
  getEmailConfirmationRedirectUrl,
  parseAuthConfirmationUrl,
} from '@/lib/auth-deep-link';
import { assertSupabaseEnv } from '@/lib/env';
import { normalizePhoneNumber } from '@/lib/phone';
import { supabase } from '@/lib/supabase';
import type {
  AuthVerificationTarget,
  LoginFormValues,
  SignupFormValues,
} from '@/types/auth';
import type { VerificationProfile } from '@/types/verification';

export type AuthResult = {
  session: Session | null;
  user: User | null;
  needsEmailConfirmation: boolean;
  verificationTarget?: AuthVerificationTarget;
  message?: string;
};

export type EmailConfirmationResult = {
  session: Session | null;
  user: User | null;
  message: string;
};

export async function signIn(values: LoginFormValues): Promise<AuthResult> {
  assertSupabaseEnv();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: values.email.trim().toLowerCase(),
    password: values.password,
  });

  if (error) {
    throw error;
  }

  return {
    session: data.session,
    user: data.user,
    needsEmailConfirmation: false,
  };
}

export async function signUp(values: SignupFormValues): Promise<AuthResult> {
  assertSupabaseEnv();
  const normalizedEmail = values.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneNumber(values.phoneNumber);
  const referralCode = values.referralCode?.trim();

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: values.password,
    options: {
      emailRedirectTo: getEmailConfirmationRedirectUrl(),
      data: {
        full_name: values.fullName.trim(),
        phone_number: normalizedPhone,
        referral_code: referralCode || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  const needsEmailConfirmation = !data.session;
  const verificationTarget: AuthVerificationTarget | undefined =
    needsEmailConfirmation || normalizedPhone
      ? {
          email: normalizedEmail,
          phone: normalizedPhone || null,
          nextStep: needsEmailConfirmation ? 'email' : 'phone',
        }
      : undefined;

  return {
    session: data.session,
    user: data.user,
    needsEmailConfirmation,
    verificationTarget,
    message: needsEmailConfirmation
      ? 'Enter the email code we sent to finish setting up your account inside the app.'
      : normalizedPhone
        ? 'Confirm the SMS code we sent to secure your phone number.'
        : 'Your Greencard account is ready. Complete profile and identity verification inside the app to unlock full access.',
  };
}

export async function verifyEmailOtp(
  email: string,
  token: string,
  type: EmailOtpType = 'signup',
) {
  assertSupabaseEnv();

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: token.trim(),
    type,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resendSignupEmailOtp(email: string) {
  assertSupabaseEnv();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: getEmailConfirmationRedirectUrl(),
    },
  });

  if (error) {
    throw error;
  }
}

export async function beginPhoneVerification(phoneNumber: string) {
  assertSupabaseEnv();

  const normalizedPhone = normalizePhoneNumber(phoneNumber);
  const { data, error } = await supabase.auth.updateUser({
    phone: normalizedPhone,
  });

  if (error) {
    throw error;
  }

  return {
    user: data.user,
    phone: normalizedPhone,
  };
}

export async function verifyPhoneOtp(
  phoneNumber: string,
  token: string,
  type: MobileOtpType = 'phone_change',
) {
  assertSupabaseEnv();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: normalizePhoneNumber(phoneNumber),
    token: token.trim(),
    type,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resendPhoneVerificationOtp(
  phoneNumber: string,
  type: MobileOtpType = 'phone_change',
) {
  assertSupabaseEnv();

  const { error } = await supabase.auth.resend({
    type,
    phone: normalizePhoneNumber(phoneNumber),
  });

  if (error) {
    throw error;
  }
}

export async function completeEmailConfirmation(
  url: string,
): Promise<EmailConfirmationResult> {
  assertSupabaseEnv();

  const { accessToken, refreshToken, tokenHash, type, errorCode, errorDescription } =
    parseAuthConfirmationUrl(url);

  if (errorCode || errorDescription) {
    throw new Error(
      errorDescription ||
        `Email confirmation failed${errorCode ? ` (${errorCode})` : ''}.`,
    );
  }

  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      throw error;
    }

    return {
      session: data.session,
      user: data.user,
      message: 'Email confirmed. Taking you into your account.',
    };
  }

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      throw error;
    }

    return {
      session: data.session,
      user: data.user,
      message: data.session
        ? 'Email confirmed. Taking you into your account.'
        : 'Email confirmed. You can now log in to continue.',
    };
  }

  const session = await getSession();

  if (session) {
    return {
      session,
      user: session.user,
      message: 'Email confirmed. Taking you into your account.',
    };
  }

  throw new Error(
    'We could not finish confirming your email. Please open the latest confirmation email again.',
  );
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getCurrentUser() {
  assertSupabaseEnv();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    if (error.name === 'AuthSessionMissingError') {
      return null;
    }

    throw error;
  }

  return data.user;
}

export async function updateVerificationProfileMetadata(profile: VerificationProfile) {
  assertSupabaseEnv();

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('No signed-in user found for verification sync.');
  }

  const existingMetadata = (currentUser.user_metadata || {}) as Record<string, unknown>;

  const nextMetadata = {
    ...existingMetadata,
    full_name: profile.fullName.trim() || existingMetadata.full_name || null,
    phone_number:
      profile.phoneNumber.trim() ||
      existingMetadata.phone_number ||
      existingMetadata.phone ||
      null,
    date_of_birth: profile.dateOfBirth.trim() || null,
    residential_address: profile.address.trim() || null,
    nationality: profile.nationality.trim() || null,
    profile_completed_at: profile.profileCompletedAt,
    verification_status: profile.status,
    has_bvn: profile.hasBVN,
    has_nin: profile.hasNIN,
    bvn_last4: profile.bvnLast4,
    nin_last4: profile.ninLast4,
    verification_completed_at: profile.verificationCompletedAt,
  };

  const { data, error } = await supabase.auth.updateUser({
    data: nextMetadata,
  });

  if (error) {
    throw error;
  }

  return data.user;
}
