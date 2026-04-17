import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren,useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import * as authService from '@/services/auth-service';
import type { SessionContextValue } from '@/types/auth';

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    authService
      .getSession()
      .then((nextSession) => {
        if (isMounted) {
          setSession(nextSession);
          setIsReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsReady(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    try {
      await authService.signOut();
    } finally {
      // Ensure local protected routes are exited even if auth callbacks lag.
      setSession(null);
      setIsReady(true);
    }
  }

  async function refreshSession() {
    const nextSession = await authService.getSession();
    setSession(nextSession);
  }

  return (
    <SessionContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isReady,
        signOut: handleSignOut,
        refreshSession,
      }}>
      {children}
    </SessionContext.Provider>
  );
}
