import { useRouter } from 'expo-router';

import { AppCard } from '@/components/ui/app-card';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthSwitchRow } from '@/features/auth/components/auth-switch-row';
import { LoginForm } from '@/features/auth/components/login-form';
import { hasSupabaseEnv } from '@/lib/env';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title="Log in to your Greencard account"
      description="Pick up your balances, cards, and payment activity with secure access to the workspace.">
      {!hasSupabaseEnv ? (
        <NoticeBanner message="Add your Supabase keys to .env before trying to log in." />
      ) : null}

      <AppCard>
        <LoginForm />
      </AppCard>

      <AuthSwitchRow
        prompt="New to Greencard?"
        actionLabel="Create an account"
        onPress={() => router.push('/signup')}
      />
    </AuthShell>
  );
}
