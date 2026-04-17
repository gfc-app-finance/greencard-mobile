import {
  canCreateVirtualCard,
  canFundVirtualCard,
  canManageVirtualCard,
  hasActiveManagedCard,
} from '@/features/cards/card-access';
import type { ManagedCard } from '@/types/fintech';
import type { VerificationAccess } from '@/types/verification';

const verifiedAccess: VerificationAccess = {
  canAddMoney: true,
  canMoveMoney: true,
  canCreateAccount: true,
  canCreateCard: true,
  canFundCard: true,
  canManageCard: true,
  canSendPayment: true,
  canReceivePayment: true,
  canUseFullPaymentFlow: true,
  isBasic: false,
  isProfileCompleted: false,
  isVerified: true,
  needsProfileCompletion: false,
  needsIdentityVerification: false,
};

const managedCard: ManagedCard = {
  id: 'card_1',
  name: 'GCF Virtual Card',
  network: 'Visa',
  type: 'Virtual',
  last4: '2048',
  currency: 'Foreign online spend',
  spendLimit: 'USD 2,500 / month',
  spendLimitAmount: 2500,
  spendLimitCurrencyCode: 'USD',
  monthlySpentAmount: 0,
  monthlySpentDisplay: '$0.00',
  fundingSourceAccountId: 'acct_usd',
  fundingSourceLabel: 'GCF USD Account',
  fundingSourceBalanceDisplay: '$1,000.00',
  linkedBalanceLabel: 'USD, GBP, EUR',
  usageNote: 'Use one GCF virtual card for international online payments.',
  status: 'active',
  createdAt: '2026-04-17T09:00:00.000Z',
  recentActivity: [],
};

describe('card access helpers', () => {
  it('recognizes whether the user already has an active managed card', () => {
    expect(hasActiveManagedCard([])).toBe(false);
    expect(hasActiveManagedCard([managedCard])).toBe(true);
  });

  it('only allows creation when verification access permits it', () => {
    expect(canCreateVirtualCard(verifiedAccess)).toBe(true);
    expect(canCreateVirtualCard({ ...verifiedAccess, canCreateCard: false })).toBe(false);
  });

  it('requires both permission and a non-terminated card for funding and management', () => {
    expect(canFundVirtualCard(verifiedAccess, managedCard)).toBe(true);
    expect(canManageVirtualCard(verifiedAccess, managedCard)).toBe(true);
    expect(
      canManageVirtualCard(verifiedAccess, { ...managedCard, status: 'terminated' })
    ).toBe(false);
  });
});
