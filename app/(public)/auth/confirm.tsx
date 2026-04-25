import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

export default function AuthConfirm() {
  const router = useRouter();
  const { token, type } = useLocalSearchParams();

  useEffect(() => {
    const verifyEmail = async () => {
      if (token && type === 'signup') {
        try {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token as string,
            type: 'signup',
          });

          if (!error) {
            router.replace('/(protected)/(tabs)' as any);
          } else {
            console.error('Verification error:', error.message);
            router.replace('/(public)/login');
          }
        } catch (err) {
          console.error('System error during verification:', err);
          router.replace('/(public)/login');
        }
      }
    };

    verifyEmail();
  }, [token, type, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0F766E" />
      <Text style={styles.text}>Finalizing your secure account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    marginTop: 20,
    fontWeight: '600',
    opacity: 0.7,
  },
});
