import type { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

import { getHomeDashboardSnapshot } from '@/services/home-dashboard-service';

export function useDashboardQuery(user: User | null | undefined) {
  return useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => getHomeDashboardSnapshot(user),
    enabled: Boolean(user),
    staleTime: 5 * 60_000,
  });
}
