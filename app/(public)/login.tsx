import { useRouter } from 'expo-router';
import { ChevronLeft, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

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
    >
      <View style={[styles.premiumGlow, { marginTop: -15 }]}>
        <AppCard>
          <View style={{ marginBottom: 8, alignItems: 'flex-end' }}>
            <ShieldCheck color="#107569" size={20} opacity={0.4} strokeWidth={2.5} />
          </View>
          <LoginForm />
        </AppCard>
      </View>

      <View style={styles.switchRowContainer}>
        <AuthSwitchRow
          prompt="New to Greencard?"
          actionLabel="Create an account"
          onPress={() => router.push('/signup')}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  premiumGlow: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginTop: -30,
    shadowColor: '#107569',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.18,
    shadowRadius: 25,
    elevation: 10,
  },
  switchRowContainer: {
    marginTop: 32,
    paddingBottom: 40,
  },
});
