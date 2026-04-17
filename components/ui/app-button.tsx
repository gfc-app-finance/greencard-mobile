import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type AppButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

const buttonStyles = {
  primary: {
    backgroundColor: Colors.primaryStrong,
    borderColor: Colors.primaryStrong,
    labelColor: Colors.white,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    labelColor: Colors.text,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
    labelColor: Colors.textMuted,
  },
} as const;

export function AppButton({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  containerStyle,
  ...pressableProps
}: AppButtonProps) {
  const config = buttonStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        containerStyle,
      ]}
      {...pressableProps}>
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={config.labelColor} size="small" /> : null}
        <Text style={[styles.label, { color: config.labelColor }]}>
          {loading ? 'Please wait' : title}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderCurve: 'continuous',
    minHeight: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    letterSpacing: Typography.body.letterSpacing,
    lineHeight: Typography.body.lineHeight,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.55,
  },
});
