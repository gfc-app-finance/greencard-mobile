import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <AppScreen>
      <View style={styles.container}>
        <AppCard style={styles.card}>
          <Text style={styles.title}>Screen not found</Text>
          <Text style={styles.description}>
            That route does not exist in the Greencard router yet.
          </Text>
          <AppButton title="Go to welcome" onPress={() => router.replace('/')} />
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 320,
  },
  card: {
    gap: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
});
