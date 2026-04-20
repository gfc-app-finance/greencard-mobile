import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

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
      headerLeft={
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <ChevronLeft color="#107569" size={28} strokeWidth={2.5} />
        </Pressable>
      }
      eyebrow="CREATE ACCOUNT"
      title="Create your Greencard account"
      description="Banking without borders"
    >
      {!hasSupabaseEnv ? (
        <NoticeBanner message="Add your Supabase keys to .env before testing sign up." />
      ) : null}

      <AppCard>
        <SignupForm />
      </AppCard>

      <View style={{ marginTop: 32 }}>
        <AuthSwitchRow
          prompt="Already have an account?"
          actionLabel="Log in"
          onPress={() => router.replace('/login')}
        />
      </View>

      <View style={{ marginTop: 40, paddingHorizontal: 24, paddingBottom: 40 }}>
        <View
          style={{
            height: 1,
            backgroundColor: '#E5E7EB',
            width: '100%',
            marginBottom: 24,
          }}
        />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#6B7280', textAlign: 'center' }}>
            By continuing, you agree to our{' '}
            <Text style={{ color: '#107569', fontWeight: '500' }}>Terms of Service</Text>{' '}
            and{' '}
            <Text style={{ color: '#107569', fontWeight: '500' }}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </AuthShell>
  );
}
