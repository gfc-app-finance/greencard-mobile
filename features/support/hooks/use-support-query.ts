import { useQuery } from '@tanstack/react-query';

import { getSupportSnapshot, getSupportTicket } from '@/services/support-service';

export function useSupportSnapshotQuery() {
  return useQuery({
    queryKey: ['support'],
    queryFn: getSupportSnapshot,
    staleTime: 5 * 60_000,
  });
}

export function useSupportTicketQuery(ticketId: string | null) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => getSupportTicket(ticketId ?? ''),
    enabled: Boolean(ticketId),
    staleTime: 5 * 60_000,
  });
}
