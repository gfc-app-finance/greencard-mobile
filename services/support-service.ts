import { Colors } from '@/constants/colors';
import type { SupportSnapshot, SupportTicket } from '@/types/support';

const supportTickets: SupportTicket[] = [
  {
    id: 'TKT-2041',
    title: 'Missing GBP inbound transfer',
    category: 'Missing Transfer',
    preview: 'Inbound payment has not reflected in your GBP balance after confirmation.',
    updatedAt: 'Updated 18 mins ago',
    statusLabel: 'Investigating',
    statusTone: 'warning',
    linkedTransaction: {
      id: 'TX-88312',
      title: 'Inbound transfer from Brightwell Consulting',
      amount: 'GBP 1,180.40',
      date: '11 Apr 2026, 09:14',
      accountLabel: 'GCF GBP Account',
      statusLabel: 'Pending review',
    },
    messages: [
      {
        id: 'msg-1',
        sender: 'support',
        authorName: 'Greencard Support',
        body: 'We can see the payment instruction on the rail. Our team is checking the beneficiary validation now.',
        timestamp: '09:41',
      },
      {
        id: 'msg-2',
        sender: 'user',
        authorName: 'You',
        body: 'Thanks. I need to confirm whether this will settle today because it is part of my tuition payment.',
        timestamp: '09:46',
      },
      {
        id: 'msg-3',
        sender: 'support',
        authorName: 'Greencard Support',
        body: 'Understood. We have prioritized the review and will update this thread as soon as the payment clears.',
        timestamp: '09:53',
      },
    ],
  },
  {
    id: 'TKT-1988',
    title: 'Virtual card declined at checkout',
    category: 'Card Declined',
    preview: 'The card was declined during a recurring software renewal.',
    updatedAt: 'Updated 2 hrs ago',
    statusLabel: 'Waiting for you',
    statusTone: 'info',
    linkedTransaction: {
      id: 'TX-87104',
      title: 'Software renewal authorization',
      amount: 'USD 49.00',
      date: '11 Apr 2026, 07:02',
      accountLabel: 'GCF USD Account',
      statusLabel: 'Authorization reversed',
    },
    messages: [
      {
        id: 'msg-4',
        sender: 'support',
        authorName: 'Greencard Support',
        body: 'We noticed the merchant requested a recurring token, but the virtual card is currently locked for recurring spend.',
        timestamp: '07:18',
      },
      {
        id: 'msg-5',
        sender: 'user',
        authorName: 'You',
        body: 'Please confirm if I should unlock recurring payments or generate a new card.',
        timestamp: '07:26',
      },
    ],
  },
  {
    id: 'TKT-1912',
    title: 'Account limits clarification',
    category: 'Account Limits',
    preview: 'You asked about your tier upgrade path and cross-border collection limits.',
    updatedAt: 'Updated yesterday',
    statusLabel: 'Resolved',
    statusTone: 'success',
    messages: [
      {
        id: 'msg-6',
        sender: 'support',
        authorName: 'Greencard Support',
        body: 'Your current tier supports the present collection volume. We also shared the documents needed for the next upgrade.',
        timestamp: 'Yesterday',
      },
    ],
  },
];

const supportSnapshot: SupportSnapshot = {
  quickIssues: [
    {
      id: 'issue-failed-payment',
      title: 'Failed Payment',
      subtitle: 'Card or transfer did not go through as expected.',
      iconName: 'alert-circle',
      accentColor: Colors.secondary,
      ticketId: 'TKT-1988',
    },
    {
      id: 'issue-card-declined',
      title: 'Card Declined',
      subtitle: 'Review card controls, recurring spend, or merchant errors.',
      iconName: 'credit-card',
      accentColor: Colors.primaryStrong,
      ticketId: 'TKT-1988',
    },
    {
      id: 'issue-missing-transfer',
      title: 'Missing Transfer',
      subtitle: 'Track an inbound or outbound transfer that is delayed.',
      iconName: 'clock',
      accentColor: Colors.violet,
      ticketId: 'TKT-2041',
    },
    {
      id: 'issue-account-limits',
      title: 'Account Limits',
      subtitle: 'Understand tier limits, review caps, and upgrade options.',
      iconName: 'sliders',
      accentColor: Colors.primary,
      ticketId: 'TKT-1912',
    },
  ],
  tickets: supportTickets,
  createTicketTitle: 'Create Ticket',
  createTicketDescription:
    'Reach the Greencard operations team with transaction context, account details, and a secure support thread.',
};

export async function getSupportSnapshot(): Promise<SupportSnapshot> {
  return supportSnapshot;
}

export async function getSupportTicket(ticketId: string): Promise<SupportTicket | null> {
  return supportTickets.find((ticket) => ticket.id === ticketId) ?? null;
}
