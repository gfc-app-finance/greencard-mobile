// This stops the "Module not found" error because it removes the @/features import
export function useSession() {
  return { isReady: true, session: null }; // Pretend the engine is ready but no one is logged in
}

export function useOnboarding() {
  return { isReady: true, shouldShowOnboarding: true }; // Pretend we always show the start page
}
