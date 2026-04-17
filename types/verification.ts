export type VerificationStatus =
  | 'basic'
  | 'profile_completed'
  | 'under_review'
  | 'restricted'
  | 'verified';

export type VerificationProfile = {
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  nationality: string;
  profileCompletedAt: string | null;
  bvn: string | null;
  nin: string | null;
  status: VerificationStatus;
  hasBVN: boolean;
  hasNIN: boolean;
  verificationCompletedAt: string | null;
  bvnLast4: string | null;
  ninLast4: string | null;
};

export type RestrictedFeature =
  | 'add_money'
  | 'move_money'
  | 'create_virtual_account'
  | 'create_virtual_card'
  | 'send_payment'
  | 'receive_payment';

export type VerificationAccess = {
  canAddMoney: boolean;
  canMoveMoney: boolean;
  canCreateAccount: boolean;
  canCreateCard: boolean;
  canFundCard: boolean;
  canManageCard: boolean;
  canSendPayment: boolean;
  canReceivePayment: boolean;
  canUseFullPaymentFlow: boolean;
  isBasic: boolean;
  isProfileCompleted: boolean;
  isVerified: boolean;
  needsProfileCompletion: boolean;
  needsIdentityVerification: boolean;
};
