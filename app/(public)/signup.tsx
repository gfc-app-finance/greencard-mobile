import { useRouter } from 'expo-router';

import { AppCard } from '@/components/ui/app-card';
import { NoticeBanner } from '@/components/ui/notice-banner';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthSwitchRow } from '@/features/auth/components/auth-switch-row';
import { SignupForm } from '@/features/auth/components/signup-form';
import { hasSupabaseEnv } from '@/lib/env';

export default function SignupScreen() {
  const router = useRouter();

  return (
    <AuthShell
      eyebrow="CREATE ACCOUNT"
      title="Create your Greencard account"
      description="Banking without boarders">
      {!hasSupabaseEnv ? (
        <NoticeBanner message="Add your Supabase keys to .env before testing sign up." />
      ) : null}

      <AppCard>
        <SignupForm />
      </AppCard>

      <AuthSwitchRow
        prompt="Already have an account?"
        actionLabel="Log in"
        onPress={() => router.replace('/login')}
      />
    </AuthShell>
  );
}
