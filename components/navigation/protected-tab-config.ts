import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type ProtectedTabName =
  | 'home'
  | 'payments'
  | 'activity'
  | 'support';

export type ProtectedTabConfigItem = {
  name: ProtectedTabName;
  title: string;
  iconName: ComponentProps<typeof Feather>['name'];
};

export const protectedTabConfig: ProtectedTabConfigItem[] = [
  {
    name: 'home',
    title: 'Home',
    iconName: 'home',
  },
  {
    name: 'payments',
    title: 'Payments',
    iconName: 'repeat',
  },
  {
    name: 'activity',
    title: 'Activity',
    iconName: 'activity',
  },
  {
    name: 'support',
    title: 'Support',
    iconName: 'life-buoy',
  },
];
