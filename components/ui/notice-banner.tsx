import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

type NoticeTone = 'info' | 'success' | 'error';

type NoticeBannerProps = {
  message: string;
  tone?: NoticeTone;
};

const toneStyles = {
  info: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.22)',
    textColor: Colors.text,
  },
  success: {
    backgroundColor: 'rgba(43, 182, 115, 0.1)',
    borderColor: 'rgba(43, 182, 115, 0.22)',
    textColor: Colors.success,
  },
  error: {
    backgroundColor: 'rgba(217, 108, 108, 0.1)',
    borderColor: 'rgba(217, 108, 108, 0.22)',
    textColor: Colors.danger,
  },
} as const;

export function NoticeBanner({ message, tone = 'info' }: NoticeBannerProps) {
  const config = toneStyles[tone];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}>
      <Text style={[styles.text, { color: config.textColor }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  text: {
    fontSize: Typography.secondary.fontSize,
    fontWeight: '500',
    lineHeight: Typography.secondary.lineHeight,
  },
});
