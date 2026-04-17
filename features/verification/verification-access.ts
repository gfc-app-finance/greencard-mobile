import type {
  RestrictedFeature,
  VerificationAccess,
  VerificationProfile,
  VerificationStatus,
} from '@/types/verification';

export type RestrictedFeatureCopy = {
  title: string;
  description: string;
  ctaLabel: string;
};

const restrictedFeatureCopyMap: Record<RestrictedFeature, RestrictedFeatureCopy> = {
  add_money: {
    title: 'Add money is locked',
    description:
      'Complete your profile, then verify BVN and NIN to unlock wallet funding.',
    ctaLabel: 'Unlock full access',
  },
  move_money: {
    title: 'Move money is locked',
    description:
      'Complete profile and identity verification to move money across wallets and currencies.',
    ctaLabel: 'Complete verification',
  },
  create_virtual_account: {
    title: 'Virtual account creation is locked',
    description:
      'Profile and identity verification are required before creating new virtual receiving accounts.',
    ctaLabel: 'Unlock accounts',
  },
  create_virtual_card: {
    title: 'Card creation is locked',
    description:
      'Only fully verified users can create, fund, and manage a GCF virtual card for foreign online payments.',
    ctaLabel: 'Unlock virtual card',
  },
  send_payment: {
    title: 'Payments are locked',
    description:
      'Complete profile, BVN, and NIN verification to send and receive payments.',
    ctaLabel: 'Unlock payments',
  },
  receive_payment: {
    title: 'Receiving details are locked',
    description:
      'Complete verification to reveal full receiving details and enable incoming payments.',
    ctaLabel: 'Unlock receiving',
  },
};

export const defaultVerificationProfile: VerificationProfile = {
  fullName: '',
  email: '',
  phoneNumber: '',
  dateOfBirth: '',
  address: '',
  nationality: '',
  profileCompletedAt: null,
  bvn: null,
  nin: null,
  status: 'basic',
  hasBVN: false,
  hasNIN: false,
  verificationCompletedAt: null,
  bvnLast4: null,
  ninLast4: null,
};

export function hasCompletedProfileDetails(profile: VerificationProfile) {
  return Boolean(
    profile.dateOfBirth.trim() &&
      profile.address.trim() &&
      profile.nationality.trim()
  );
}

export function resolveVerificationStatus(
  hasCompletedProfile: boolean,
  hasBVN: boolean,
  hasNIN: boolean
): VerificationStatus {
  if (hasBVN && hasNIN) {
    return 'verified';
  }

  if (hasCompletedProfile) {
    return 'profile_completed';
  }

  return 'basic';
}

export function buildVerificationAccess(
  profile: VerificationProfile
): VerificationAccess {
  const isVerified = profile.status === 'verified';
  const isBasic = profile.status === 'basic';
  const isProfileCompleted = profile.status === 'profile_completed';

  return {
    canAddMoney: isVerified,
    canMoveMoney: isVerified,
    canCreateAccount: isVerified,
    canCreateCard: isVerified,
    canFundCard: isVerified,
    canManageCard: isVerified,
    canSendPayment: isVerified,
    canReceivePayment: isVerified,
    canUseFullPaymentFlow: isVerified,
    isBasic,
    isProfileCompleted,
    isVerified,
    needsProfileCompletion: isBasic,
    needsIdentityVerification: isProfileCompleted,
  };
}

export function isFeatureAllowed(
  access: VerificationAccess,
  feature: RestrictedFeature
) {
  if (feature === 'add_money') {
    return access.canAddMoney;
  }

  if (feature === 'move_money') {
    return access.canMoveMoney;
  }

  if (feature === 'create_virtual_account') {
    return access.canCreateAccount;
  }

  if (feature === 'create_virtual_card') {
    return access.canCreateCard;
  }

  if (feature === 'send_payment') {
    return access.canSendPayment;
  }

  if (feature === 'receive_payment') {
    return access.canReceivePayment;
  }

  return false;
}

export function getRestrictedFeatureCopy(feature: RestrictedFeature) {
  return restrictedFeatureCopyMap[feature];
}

export function getVerificationJourneyRoute(profile: VerificationProfile) {
  if (profile.status === 'basic') {
    return '/complete-profile' as const;
  }

  return '/verification' as const;
}
