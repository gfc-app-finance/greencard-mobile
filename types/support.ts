import type { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type SupportIconName = ComponentProps<typeof Feather>['name'];
export type SupportStatusTone = 'info' | 'warning' | 'success';

export type SupportQuickIssue = {
  id: string;
  title: string;
  subtitle: string;
  iconName: SupportIconName;
  accentColor: string;
  ticketId?: string;
};

export type SupportLinkedTransaction = {
  id: string;
  title: string;
  amount: string;
  date: string;
  accountLabel: string;
  statusLabel: string;
};

export type SupportMessage = {
  id: string;
  sender: 'support' | 'user';
  authorName: string;
  body: string;
  timestamp: string;
};

export type SupportTicket = {
  id: string;
  title: string;
  category: string;
  preview: string;
  updatedAt: string;
  statusLabel: string;
  statusTone: SupportStatusTone;
  linkedTransaction?: SupportLinkedTransaction;
  messages: SupportMessage[];
};

export type SupportSnapshot = {
  quickIssues: SupportQuickIssue[];
  tickets: SupportTicket[];
  createTicketTitle: string;
  createTicketDescription: string;
};
