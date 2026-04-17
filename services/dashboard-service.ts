// @ts-nocheck
import type { User } from '@supabase/supabase-js';

import { Colors } from '@/constants/colors';
import { getUserFirstName, getUserInitials } from '@/lib/user';
import type { DashboardSnapshot } from '@/types/dashboard';

export async function getDashboardSnapshot(
  user: User | null | undefined
): Promise<DashboardSnapshot> {
  const firstName = getUserFirstName(user);

  return {
    greetingName: firstName,
    avatarInitials: getUserInitials(user),
    totalBalance: '₦12,480,350.20',
    maskedTotalBalance: '₦••,•••,•••.••',
    localAccount: {
      accountName: 'GCF NGN Account',
      accountNumber: '1029384756',
      providerName: 'Providus Bank',
      statusLabel: 'Tier 2 Verified',
      note: 'Transfers and collections are active today',
    },
    currencyAccounts: [
      {
        id: 'usd',
        currencyCode: 'USD',
        currencyLabel: 'US Dollar',
        balance: '$3,240.12',
        note: 'Receiving details ready',
        changeLabel: '+2.4% this month',
        accentColor: Colors.primaryStrong,
        accentSoftColor: Colors.primarySoft,
      },
      {
        id: 'gbp',
        currencyCode: 'GBP',
        currencyLabel: 'British Pound',
        balance: '£1,180.40',
        note: '1 pending inbound payment',
        changeLabel: 'Local details enabled',
        accentColor: Colors.secondary,
        accentSoftColor: 'rgba(217, 164, 65, 0.14)',
      },
      {
        id: 'eur',
        currencyCode: 'EUR',
        currencyLabel: 'Euro Wallet',
        balance: '€640.90',
        note: 'Ready when you need it',
        changeLabel: 'Virtual IBAN available',
        accentColor: Colors.violet,
        accentSoftColor: Colors.violetSoft,
      },
    ],
    quickActions: [
      {
        id: 'add-money',
        label: 'Add Money',
        iconName: 'plus-circle',
        accentColor: Colors.primaryStrong,
      },
      {
        id: 'pay',
        label: 'Pay',
        iconName: 'arrow-up-right',
        accentColor: Colors.secondary,
      },
      {
        id: 'receive',
        label: 'Receive',
        iconName: 'arrow-down-left',
        accentColor: Colors.primary,
      },
      {
        id: 'virtual-card',
        label: 'Virtual Card',
        iconName: 'credit-card',
        accentColor: Colors.violet,
      },
      {
        id: 'global-account',
        label: 'Global Acc',
        iconName: 'globe',
        accentColor: Colors.primaryStrong,
      },
      {
        id: 'send',
        label: 'Send',
        iconName: 'send',
        accentColor: Colors.secondary,
      },
    ],
    savingsGoals: [
      {
        id: 'uk-masters',
        name: "UK Master's Fund",
        savedAmount: '₦4,200,000',
        targetAmount: '₦8,500,000',
        progressPercentage: 49,
        note: 'Auto-save every Friday with roundup boosts',
        cadenceLabel: 'Target for September intake',
      },
    ],
  };
}
