import type { User } from '@supabase/supabase-js';
import { useMemo } from 'react';

import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { useCurrentUserQuery } from '@/features/auth/hooks/use-auth';
import { useSession } from '@/hooks/use-session';
import { buildHomeDashboardSnapshot } from '@/services/goova-app-state-service';
import type { DashboardAccount } from '@/types/dashboard';

export function useHomeDashboard() {
  const { user: sessionUser } = useSession();
  const currentUserQuery = useCurrentUserQuery(Boolean(sessionUser));
  const user = currentUserQuery.data ?? sessionUser;
  const appState = useGoovaAppState();
  const dashboard = useMemo(
    () => (user ? buildHomeDashboardSnapshot(user, appState) : null),
    [appState, user]
  );

  return {
    user,
    dashboard,
    dashboardQuery: null,
    currentUserQuery,
    isLoading: !user || currentUserQuery.isLoading || !dashboard,
  };
}

export function getDashboardAccount(
  accounts: DashboardAccount[],
  accountId: string | string[] | undefined
) {
  if (typeof accountId === 'string') {
    const matchedAccount = accounts.find((account) => account.id === accountId);

    if (matchedAccount) {
      return matchedAccount;
    }
  }

  return accounts[0];
}

export function getUserDashboardName(user: User | null | undefined) {
  return user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'there';
}
