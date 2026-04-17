import type { User } from '@supabase/supabase-js';

import { Colors } from '@/constants/colors';
import { getUserFirstName, getUserInitials } from '@/lib/user';
import type { DashboardSnapshot } from '@/types/dashboard';

export async function getHomeDashboardSnapshot(
  user: User | null | undefined
): Promise<DashboardSnapshot> {
  const firstName = getUserFirstName(user);

  return {
    greetingName: firstName,
    avatarInitials: getUserInitials(user),
    defaultAccountId: 'ngn',
    accounts: [
      {
        id: 'ngn',
        accountType: 'Personal',
        currencyCode: 'NGN',
        currencyLabel: 'Nigerian Naira',
        displayName: 'GCF NGN Account',
        balance: 'NGN 12,480',
        maskedBalance: 'NGN **,***,***.**',
        balanceNote: 'Your main local balance for daily transfers and collections.',
        accountNumber: '1029384756',
        providerName: 'Providus Bank',
        status: 'active',
        statusLabel: 'Tier 2 Verified',
        summaryNote: 'Transfers, collections, and local settlements are active today.',
        changeLabel: 'Primary wallet',
        selectorHint: 'Local account ready',
        accentColor: Colors.primaryStrong,
        accentSoftColor: Colors.primarySoft,
        actionLabel: 'Accounts',
        fundingSourceLabel: 'Providus Bank · NGN',
        minimumAddMoney: 'NGN 5,000 minimum',
        addMoneyQuickAmounts: ['NGN 10,000', 'NGN 25,000', 'NGN 50,000', 'NGN 100,000'],
        moveMoneyQuickAmounts: ['NGN 25,000', 'NGN 50,000', 'NGN 75,000', 'NGN 100,000'],
        detailsSections: [
          {
            id: 'local',
            title: 'For local transfers only',
            description: 'Use these details to receive Naira transfers inside Nigeria.',
            items: [
              {
                id: 'beneficiary',
                label: 'Beneficiary',
                value: 'Sodiq Ojodu',
              },
              {
                id: 'bank',
                label: 'Bank',
                value: 'Providus Bank',
              },
              {
                id: 'account-number',
                label: 'Account number',
                value: '1029384756',
              },
              {
                id: 'reference',
                label: 'Reference',
                value: 'Use your GCF tag for faster matching',
              },
            ],
          },
          {
            id: 'international',
            title: 'For international receipts',
            description: 'International settlement details for verified business and freelance income.',
            items: [
              {
                id: 'beneficiary-intl',
                label: 'Beneficiary',
                value: 'GCF Customer Holding',
              },
              {
                id: 'provider-intl',
                label: 'Provider',
                value: 'GCF Settlement Rail',
              },
              {
                id: 'memo-intl',
                label: 'Reference note',
                value: 'Share your customer memo before payout',
              },
            ],
          },
        ],
        safeguardingNote:
          'Your Naira balance is safeguarded with licensed partner banks and regulated payment infrastructure.',
        shareDetailsText:
          'GCF NGN Account\nBeneficiary: Sodiq Ojodu\nBank: Providus Bank\nAccount number: 1029384756',
      },
      {
        id: 'usd',
        accountType: 'Personal',
        currencyCode: 'USD',
        currencyLabel: 'US Dollar',
        displayName: 'GCF USD Account',
        balance: 'USD 3,240.12',
        maskedBalance: 'USD *,***.**',
        balanceNote: 'Receive client payments and hold USD in one place.',
        accountNumber: 'ACH routing ending 4821',
        providerName: 'Lead Bank Partner',
        status: 'active',
        statusLabel: 'Receiving Details Live',
        summaryNote: 'ACH and wire receiving details are ready for international clients.',
        changeLabel: '+2.4% this month',
        selectorHint: 'Receiving details ready',
        accentColor: Colors.primary,
        accentSoftColor: 'rgba(31, 168, 154, 0.12)',
        actionLabel: 'Accounts',
        fundingSourceLabel: 'Lead Bank Partner · USD',
        minimumAddMoney: 'USD 10 minimum',
        addMoneyQuickAmounts: ['USD 20', 'USD 50', 'USD 100', 'USD 250'],
        moveMoneyQuickAmounts: ['USD 10', 'USD 20', 'USD 50', 'USD 100'],
        detailsSections: [
          {
            id: 'local',
            title: 'For domestic USD receipts',
            description: 'Use these details for ACH and local U.S. transfers.',
            items: [
              {
                id: 'beneficiary',
                label: 'Beneficiary',
                value: 'Sodiq Ojodu',
              },
              {
                id: 'routing',
                label: 'Routing number',
                value: '021000021',
              },
              {
                id: 'account-number',
                label: 'Account number',
                value: '0004821',
              },
              {
                id: 'bank',
                label: 'Bank',
                value: 'Lead Bank Partner',
              },
            ],
          },
          {
            id: 'international',
            title: 'For international USD wires',
            description: 'Wire instructions for clients sending USD from abroad.',
            items: [
              {
                id: 'beneficiary-wire',
                label: 'Beneficiary',
                value: 'GCF FBO Sodiq Ojodu',
              },
              {
                id: 'swift-wire',
                label: 'SWIFT',
                value: 'LEADUS33',
              },
              {
                id: 'address-wire',
                label: 'Bank address',
                value: '1801 Main St, Kansas City, Missouri, United States',
              },
            ],
          },
        ],
        safeguardingNote:
          'USD balances are safeguarded via licensed banking partners and remain separated from Greencard operating funds.',
        shareDetailsText:
          'GCF USD Account\nBeneficiary: Sodiq Ojodu\nRouting number: 021000021\nAccount number: 0004821\nBank: Lead Bank Partner',
      },
      {
        id: 'gbp',
        accountType: 'Personal',
        currencyCode: 'GBP',
        currencyLabel: 'British Pound',
        displayName: 'GCF GBP Account',
        balance: 'GBP 1,180.40',
        maskedBalance: 'GBP *,***.**',
        balanceNote: 'Keep GBP balances ready for tuition and UK-based payouts.',
        accountNumber: 'Sort code reference ending 2718',
        providerName: 'UK Local Rails',
        status: 'active',
        statusLabel: 'Collections Enabled',
        summaryNote: 'Local details are enabled, with one inbound payment still pending.',
        changeLabel: 'Local details enabled',
        selectorHint: '1 pending inbound payment',
        accentColor: Colors.secondary,
        accentSoftColor: 'rgba(217, 164, 65, 0.14)',
        actionLabel: 'Accounts',
        fundingSourceLabel: 'Nationwide · GBP',
        minimumAddMoney: 'GBP 10 minimum',
        addMoneyQuickAmounts: ['GBP 50', 'GBP 200', 'GBP 300', 'GBP 400'],
        moveMoneyQuickAmounts: ['GBP 10', 'GBP 20', 'GBP 50', 'GBP 100'],
        detailsSections: [
          {
            id: 'local',
            title: 'For domestic transfers only',
            description: 'Use these details for Faster Payments and local U.K. transfers.',
            items: [
              {
                id: 'beneficiary',
                label: 'Beneficiary',
                value: 'Sodiq Ojodu',
              },
              {
                id: 'sort-code',
                label: 'Sort code',
                value: '04-00-75',
              },
              {
                id: 'account-number',
                label: 'Account number',
                value: '67400361',
              },
              {
                id: 'address',
                label: 'Address',
                value: 'Revolut Ltd, 30 South Colonnade, London, United Kingdom',
              },
            ],
          },
          {
            id: 'international',
            title: 'For international GBP wires',
            description: 'Wire this account when sending GBP from outside the U.K.',
            items: [
              {
                id: 'beneficiary-wire',
                label: 'Beneficiary',
                value: 'Sodiq Ojodu',
              },
              {
                id: 'swift-wire',
                label: 'BIC / SWIFT',
                value: 'REVOGB21',
              },
              {
                id: 'iban-wire',
                label: 'IBAN',
                value: 'GB82REVO04007567400361',
              },
            ],
          },
        ],
        safeguardingNote:
          'Your GBP balance is held with regulated partners and ring-fenced from Greencard operational funds.',
        shareDetailsText:
          'GCF GBP Account\nBeneficiary: Sodiq Ojodu\nSort code: 04-00-75\nAccount number: 67400361\nBank: Nationwide',
      },
      {
        id: 'eur',
        accountType: 'Personal',
        currencyCode: 'EUR',
        currencyLabel: 'Euro Wallet',
        displayName: 'GCF EUR Account',
        balance: 'EUR 640.90',
        maskedBalance: 'EUR ***.**',
        balanceNote: 'Hold EUR for planned transfers and card funding.',
        accountNumber: 'IBAN reference ending 9044',
        providerName: 'SEPA Collection Rail',
        status: 'active',
        statusLabel: 'SEPA Ready',
        summaryNote: 'SEPA-friendly receiving details are available whenever you need them.',
        changeLabel: 'Virtual IBAN available',
        selectorHint: 'Ready when you need it',
        accentColor: Colors.violet,
        accentSoftColor: Colors.violetSoft,
        actionLabel: 'Accounts',
        fundingSourceLabel: 'SEPA Rail · EUR',
        minimumAddMoney: 'EUR 10 minimum',
        addMoneyQuickAmounts: ['EUR 20', 'EUR 50', 'EUR 100', 'EUR 250'],
        moveMoneyQuickAmounts: ['EUR 10', 'EUR 20', 'EUR 50', 'EUR 100'],
        detailsSections: [
          {
            id: 'local',
            title: 'For SEPA transfers only',
            description: 'Use these details for domestic EUR and SEPA receipts.',
            items: [
              {
                id: 'beneficiary',
                label: 'Beneficiary',
                value: 'Sodiq Ojodu',
              },
              {
                id: 'iban',
                label: 'IBAN',
                value: 'DE12987654000123456789',
              },
              {
                id: 'bank',
                label: 'Bank',
                value: 'SEPA Collection Rail',
              },
              {
                id: 'reference',
                label: 'Reference',
                value: 'Use your unique GCF memo for matching',
              },
            ],
          },
          {
            id: 'international',
            title: 'For international EUR wires',
            description: 'Additional wire guidance for non-SEPA senders.',
            items: [
              {
                id: 'beneficiary-wire',
                label: 'Beneficiary',
                value: 'Greencard EUR FBO Sodiq Ojodu',
              },
              {
                id: 'swift-wire',
                label: 'BIC / SWIFT',
                value: 'SEPAGB2L',
              },
              {
                id: 'address-wire',
                label: 'Provider address',
                value: 'Rue du Commerce 12, Brussels, Belgium',
              },
            ],
          },
        ],
        safeguardingNote:
          'EUR balances are held in safeguarded partner accounts and protected by regulated settlement arrangements.',
        shareDetailsText:
          'GCF EUR Account\nBeneficiary: Sodiq Ojodu\nIBAN: DE12987654000123456789\nProvider: SEPA Collection Rail',
      },
    ],
    quickActions: [
      {
        id: 'add-money',
        label: 'Add Money',
        iconName: 'plus',
        accentColor: Colors.white,
      },
      {
        id: 'move-money',
        label: 'Move Money',
        iconName: 'shuffle',
        accentColor: Colors.white,
      },
      {
        id: 'details',
        label: 'Details',
        iconName: 'home',
        accentColor: Colors.white,
      },
      {
        id: 'more',
        label: 'More',
        iconName: 'more-horizontal',
        accentColor: Colors.white,
      },
    ],
    savingsGoals: [
      {
        id: 'uk-masters',
        name: "UK Master's Fund",
        savedAmount: 'NGN 4,200,000',
        targetAmount: 'NGN 8,500,000',
        progressPercentage: 49,
        note: 'Auto-save every Friday with roundup boosts',
        cadenceLabel: 'Target for September intake',
      },
    ],
    reminder: {
      id: 'complete-profile',
      title: 'Complete your profile',
      description: 'Provide details as part of regulatory requirements and unlock higher limits.',
      actionLabel: 'Get started',
    },
    activityPreview: [
      {
        id: 'upcoming-payment',
        title: '1 upcoming payment',
        subtitle: 'Due in 2 days',
        meta: 'Virgin Media',
        amount: '-GBP 30.50',
        tone: 'negative',
        avatarText: 'VM',
        avatarAccentColor: '#FFFFFF',
        avatarTextColor: '#E11D48',
      },
      {
        id: 'microsoft-365',
        title: 'Microsoft 365',
        subtitle: 'Yesterday, 03:09',
        meta: 'Subscription renewal',
        amount: '-GBP 1.99',
        tone: 'negative',
        avatarText: 'M',
        avatarAccentColor: '#FFFFFF',
        avatarTextColor: '#2563EB',
      },
      {
        id: 'incoming-sodiq',
        title: 'Sodiq Ojodu',
        subtitle: '9 Apr, 20:55',
        meta: 'Sodiq Ojodu',
        amount: '+GBP 500',
        tone: 'positive',
        avatarText: 'SO',
        avatarAccentColor: '#22C55E',
      },
    ],
  };
}
