import type { Session, User } from '@supabase/supabase-js';

export type AuthVerificationStep = 'email' | 'phone';

export type LoginFormValues = {
  email: string;
  password: string;
};

export type SignupFormValues = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  referralCode?: string;
};

export type AuthVerificationTarget = {
  email: string;
  phone: string | null;
  nextStep: AuthVerificationStep;
};

export type SessionContextValue = {
  session: Session | null;
  user: User | null;
  isReady: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};
