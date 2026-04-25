/**
 * FIXED: Neutralized version for the Fresh Start build.
 * We removed the @/features import to kill the TS2307 error.
 */
export function useSession() {
  // We return a "Mock" session so your app doesn't crash
  return {
    isReady: true,
    session: null,
    signOut: () => console.log('Logged out'),
    refreshSession: async () => {},
  };
}
