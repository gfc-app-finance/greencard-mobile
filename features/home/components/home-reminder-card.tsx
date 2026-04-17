import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardReminder } from '@/types/dashboard';

type HomeReminderCardProps = {
  reminder: DashboardReminder;
  onPress: () => void;
};

export function HomeReminderCard({ reminder, onPress }: HomeReminderCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconShell}>
          <Feather color={Colors.white} name="file-text" size={22} />
        </View>

        <View style={styles.copyBlock}>
          <Text style={styles.title}>{reminder.title}</Text>
          <Text style={styles.description}>{reminder.description}</Text>
        </View>
      </View>

      <AppButton
        containerStyle={styles.button}
        onPress={onPress}
        title={reminder.actionLabel}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(27, 26, 44, 0.96)',
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 15,
    lineHeight: 21,
  },
  button: {
    backgroundColor: Colors.white,
    borderColor: Colors.white,
    minHeight: 54,
  },
});
