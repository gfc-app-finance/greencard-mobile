import type { ImageSourcePropType } from 'react-native';

export type OnboardingSlide = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  accentLabel: string;
  accentValue: string;
};

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 'income',
    eyebrow: 'FOREIGN INCOME',
    title: 'Get paid from abroad with ease',
    subtitle:
      'Receive foreign income in USD, GBP, or EUR and manage it in one place.',
    image: require('../../../assets/images/onboarding/income.jpeg'),
    accentLabel: 'Supported balances',
    accentValue: 'USD  •  GBP  •  EUR',
  },
  {
    id: 'accounts',
    eyebrow: 'GLOBAL ACCOUNTS',
    title: 'Open accounts and one card for global payments',
    subtitle:
      'Create virtual accounts and a single foreign card when you need them.',
    image: require('../../../assets/images/onboarding/cards.jpeg'),
    accentLabel: 'Provisioning',
    accentValue: 'Accounts and one card on demand',
  },
  {
    id: 'visibility',
    eyebrow: 'PAYMENT CLARITY',
    title: 'See what is happening with every payment',
    subtitle:
      'Know the fee, funding source, and status before, during, and after each transaction.',
    image: require('../../../assets/images/onboarding/visibility.jpeg'),
    accentLabel: 'Live context',
    accentValue: 'Fee, source, and status in view',
  },
  {
    id: 'control',
    eyebrow: 'MONEY CONTROL',
    title: 'Stay in control of your money',
    subtitle:
      'Track activity, manage issues, and move with more confidence.',
    image: require('../../../assets/images/onboarding/control.jpeg'),
    accentLabel: 'Confidence layer',
    accentValue: 'Alerts, issues, and movement tracked',
  },
];
