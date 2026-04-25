import {
  beginPhoneVerification,
  resendPhoneVerificationOtp,
  signUp,
  verifyEmailOtp,
  verifyPhoneOtp,
} from '@/services/auth-service';

const mockSignUp = jest.fn();
const mockVerifyOtp = jest.fn();
const mockUpdateUser = jest.fn();
const mockResend = jest.fn();

jest.mock('@/lib/env', () => ({
  assertSupabaseEnv: jest.fn(),
}));

jest.mock('@/lib/auth-deep-link', () => ({
  getEmailConfirmationRedirectUrl: jest.fn(() => 'gcf://auth/confirm'),
  parseAuthConfirmationUrl: jest.fn(),
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args: unknown[]) => mockSignUp(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      resend: (...args: unknown[]) => mockResend(...args),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

describe('auth-service OTP flows', () => {
  beforeEach(() => {
    mockSignUp.mockReset();
    mockVerifyOtp.mockReset();
    mockUpdateUser.mockReset();
    mockResend.mockReset();
  });

  it('routes new signups into email OTP verification when email confirmation is required', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        session: null,
        user: { id: 'user-1' },
      },
      error: null,
    });

    const result = await signUp({
      fullName: 'Test User',
      email: '  Person@Example.com ',
      phoneNumber: '+234 801 234 5678',
      password: 'password123',
      confirmPassword: 'password123',
      referralCode: 'GCF2026',
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'person@example.com',
      password: 'password123',
      options: {
        emailRedirectTo: 'gcf://auth/confirm',
        data: {
          full_name: 'Test User',
          phone_number: '+2348012345678',
          referral_code: 'GCF2026',
        },
      },
    });
    expect(result.needsEmailConfirmation).toBe(true);
    expect(result.verificationTarget).toEqual({
      email: 'person@example.com',
      phone: '+2348012345678',
      nextStep: 'email',
    });
  });

  it('routes signups with a live session straight into phone OTP verification', async () => {
    mockSignUp.mockResolvedValue({
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
      error: null,
    });

    const result = await signUp({
      fullName: 'Test User',
      email: 'person@example.com',
      phoneNumber: '+2348012345678',
      password: 'password123',
      confirmPassword: 'password123',
      referralCode: '',
    });

    expect(result.needsEmailConfirmation).toBe(false);
    expect(result.verificationTarget).toEqual({
      email: 'person@example.com',
      phone: '+2348012345678',
      nextStep: 'phone',
    });
  });

  it('verifies the email OTP with the signup type by default', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
      error: null,
    });

    await verifyEmailOtp('person@example.com', '123456');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      email: 'person@example.com',
      token: '123456',
      type: 'signup',
    });
  });

  it('starts phone verification with a normalized phone number', async () => {
    mockUpdateUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    await beginPhoneVerification('+234 801 234 5678');

    expect(mockUpdateUser).toHaveBeenCalledWith({
      phone: '+2348012345678',
    });
  });

  it('verifies the sms OTP against the phone-change challenge by default', async () => {
    mockVerifyOtp.mockResolvedValue({
      data: {
        session: { access_token: 'token' },
        user: { id: 'user-1' },
      },
      error: null,
    });

    await verifyPhoneOtp('+234 801 234 5678', '654321');

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      phone: '+2348012345678',
      token: '654321',
      type: 'phone_change',
    });
  });

  it('resends the phone OTP through the phone-change channel', async () => {
    mockResend.mockResolvedValue({ data: {}, error: null });

    await resendPhoneVerificationOtp('+234 801 234 5678');

    expect(mockResend).toHaveBeenCalledWith({
      type: 'phone_change',
      phone: '+2348012345678',
    });
  });
});
