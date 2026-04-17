import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { SupportStatusTone } from '@/types/support';

type SupportStatusBadgeProps = {
  label: string;
  tone: SupportStatusTone;
};

const toneStyles = {
  info: {
    backgroundColor: Colors.primarySoft,
    color: Colors.primaryStrong,
  },
  warning: {
    backgroundColor: 'rgba(217, 164, 65, 0.14)',
    color: Colors.warning,
  },
  success: {
    backgroundColor: 'rgba(43, 182, 115, 0.12)',
    color: Colors.success,
  },
} as const;

export function SupportStatusBadge({
  label,
  tone,
}: SupportStatusBadgeProps) {
  const config = toneStyles[tone];

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Text style={[styles.text, { color: config.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
