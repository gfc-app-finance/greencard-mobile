import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Typography } from '@/constants/theme';

export type AppStatusChipTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'violet';

type AppStatusChipProps = {
  label: string;
  tone: AppStatusChipTone;
};

const toneStyles: Record<
  AppStatusChipTone,
  { backgroundColor: string; borderColor: string; color: string }
> = {
  neutral: {
    backgroundColor: 'rgba(147, 161, 170, 0.1)',
    borderColor: 'rgba(147, 161, 170, 0.18)',
    color: Colors.textMuted,
  },
  info: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.22)',
    color: Colors.primaryStrong,
  },
  warning: {
    backgroundColor: 'rgba(217, 164, 65, 0.12)',
    borderColor: 'rgba(217, 164, 65, 0.2)',
    color: Colors.warning,
  },
  success: {
    backgroundColor: 'rgba(43, 182, 115, 0.12)',
    borderColor: 'rgba(43, 182, 115, 0.2)',
    color: Colors.success,
  },
  danger: {
    backgroundColor: 'rgba(217, 108, 108, 0.12)',
    borderColor: 'rgba(217, 108, 108, 0.2)',
    color: Colors.danger,
  },
  violet: {
    backgroundColor: Colors.violetSoft,
    borderColor: 'rgba(95, 118, 130, 0.18)',
    color: Colors.violet,
  },
};

export function AppStatusChip({ label, tone }: AppStatusChipProps) {
  const styleTone = toneStyles[tone];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleTone.backgroundColor,
          borderColor: styleTone.borderColor,
        },
      ]}>
      <Text style={[styles.label, { color: styleTone.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 28,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontSize: Typography.micro.fontSize,
    fontWeight: '700',
    letterSpacing: Typography.micro.letterSpacing,
    lineHeight: Typography.micro.lineHeight,
  },
});
