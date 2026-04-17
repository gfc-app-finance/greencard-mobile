import type { Session, User } from '@supabase/supabase-js';

import { assertSupabaseEnv } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import type { LoginFormValues, SignupFormValues } from '@/types/auth';
import type { VerificationProfile } from '@/types/verification';

export type AuthResult = {
  session: Session | null;
  user: User | null;
  needsEmailConfirmation: boolean;
  message?: string;
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
  const referralCode = values.referralCode?.trim();

  const { data, error } = await supabase.auth.signUp({
    email: values.email.trim().toLowerCase(),
    password: values.password,
    options: {
      data: {
        full_name: values.fullName.trim(),
        phone_number: values.phoneNumber.trim(),
        referral_code: referralCode || null,
      },
    },
  });

  if (error) {
    throw error;
  }

  const needsEmailConfirmation = !data.session;

  return {
    session: data.session,
    user: data.user,
    needsEmailConfirmation,
    message: needsEmailConfirmation
      ? 'Check your email to confirm your account before signing in.'
      : 'Your Greencard account is ready. Complete profile and identity verification inside the app to unlock full access.',
  };
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

export async function updateVerificationProfileMetadata(
  profile: VerificationProfile
) {
  assertSupabaseEnv();

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error('No signed-in user found for verification sync.');
  }

  const existingMetadata = (currentUser.user_metadata || {}) as Record<
    string,
    unknown
  >;

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
