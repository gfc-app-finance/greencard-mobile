const fallbackSupabaseUrl = 'https://placeholder.supabase.co';
const fallbackSupabaseKey = 'placeholder-public-key';

const runtimeSupabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? fallbackSupabaseUrl,
  supabasePublishableKey: runtimeSupabaseKey ?? fallbackSupabaseKey,
};

export const hasSupabaseEnv = Boolean(
  process.env.EXPO_PUBLIC_SUPABASE_URL && runtimeSupabaseKey
);

export function assertSupabaseEnv() {
  if (!hasSupabaseEnv) {
    throw new Error(
      'Missing Supabase configuration. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.'
    );
  }
}
