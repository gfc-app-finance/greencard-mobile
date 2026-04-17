import {
  buildVerificationAccess,
  defaultVerificationProfile,
  getVerificationJourneyRoute,
  hasCompletedProfileDetails,
  resolveVerificationStatus,
} from '@/features/verification/verification-access';

describe('verification access helpers', () => {
  it('recognizes when profile details are complete', () => {
    expect(
      hasCompletedProfileDetails({
        ...defaultVerificationProfile,
        address: '12 Oak Street',
        dateOfBirth: '1992-07-16',
        nationality: 'Nigerian',
      })
    ).toBe(true);
  });

  it('resolves verified status only after BVN and NIN are present', () => {
    expect(resolveVerificationStatus(false, false, false)).toBe('basic');
    expect(resolveVerificationStatus(true, false, false)).toBe('profile_completed');
    expect(resolveVerificationStatus(true, true, true)).toBe('verified');
  });

  it('locks regulated actions until the user is verified', () => {
    const access = buildVerificationAccess({
      ...defaultVerificationProfile,
      status: 'profile_completed',
    });

    expect(access.canCreateCard).toBe(false);
    expect(access.canSendPayment).toBe(false);
    expect(access.needsIdentityVerification).toBe(true);
  });

  it('routes basic users to profile completion first', () => {
    expect(getVerificationJourneyRoute(defaultVerificationProfile)).toBe('/complete-profile');
    expect(
      getVerificationJourneyRoute({
        ...defaultVerificationProfile,
        status: 'profile_completed',
      })
    ).toBe('/verification');
  });
});
