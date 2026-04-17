import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type HomeHeaderProps = {
  avatarInitials: string;
  greetingName: string;
};

export function HomeHeader({
  avatarInitials,
  greetingName,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.profileWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarInitials}</Text>
        </View>

        <View style={styles.copy}>
          <Text style={styles.subtitle}>Welcome back,</Text>
          <Text style={styles.title}>{greetingName}</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel="Notifications"
        onPress={() => undefined}
        style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <Feather color={Colors.text} name="bell" size={18} />
        <View style={styles.notificationDot} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.full,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  avatarText: {
    color: Colors.primaryStrong,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  copy: {
    gap: 2,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    position: 'relative',
    width: 44,
  },
  notificationDot: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 10,
    top: 9,
    width: 10,
  },
  pressed: {
    opacity: 0.92,
  },
});
