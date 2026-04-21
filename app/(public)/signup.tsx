import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
      title="Join us"
      description=""
    >
      {!hasSupabaseEnv && <NoticeBanner message="Check .env keys" />}

      <View style={styles.premiumGlow}>
        <AppCard>
          <SignupForm />
        </AppCard>
      </View>

      <View style={styles.switchRow}>
        <AuthSwitchRow
          prompt="Have an account?"
          actionLabel="Log in"
          onPress={() => router.replace('/login')}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.divider} />
        <Text style={styles.footerText}>
          By creating an account, you agree to our{' '}
          <Text style={styles.linkText}>Terms</Text>
          {' & '}
          <Text style={styles.linkText}>Privacy Policy</Text>
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  premiumGlow: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginTop: -35,
    shadowColor: '#107569',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  switchRow: { marginTop: 10 },
  footer: { marginTop: 12, paddingHorizontal: 20, alignItems: 'center' },
  divider: { height: 1, backgroundColor: '#F3F4F6', width: '100%', marginBottom: 10 },
  footerText: { fontSize: 10.5, color: '#9CA3AF', textAlign: 'center' },
  linkText: { color: '#107569', fontWeight: '700' },
});
