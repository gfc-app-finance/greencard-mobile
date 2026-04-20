import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AuthShell } from '@/features/auth/components/auth-shell';
import { AuthSwitchRow } from '@/features/auth/components/auth-switch-row';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <AuthShell
      headerLeft={
        <Pressable onPress={() => router.back()} hitSlop={20}>
          <ChevronLeft color="#107569" size={28} strokeWidth={2.5} />
        </Pressable>
      }
      eyebrow="WELCOME BACK"
      title="Log in to your Greencard account"
      description="Pick up your balances, cards, and payment activity with secure access to the workspace."
    >
      <View style={{ flex: 1 }}>
        <View style={styles.cardGlow}>
          <AppCard>
            <View style={{ marginBottom: 12, alignItems: 'flex-end' }}>
              <ShieldCheck color="#107569" size={20} opacity={0.2} />
            </View>
            <LoginForm />
          </AppCard>
        </View>

        <View style={{ flex: 1 }} />

        <View style={{ paddingBottom: 40 }}>
          <AuthSwitchRow
            prompt="New to Greencard?"
            actionLabel="Create an account"
            onPress={() => router.push('/signup' as any)}
          />
        </View>
      </View>
    </AuthShell>
  );
}

const styles = {
  cardGlow: {
    shadowColor: '#107569',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 8,
  },
};
