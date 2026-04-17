import {
  type StyleProp,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type ViewStyle,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

type AppInputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helperText?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppInput({
  label,
  error,
  helperText,
  containerStyle,
  ...textInputProps
}: AppInputProps) {
  return (
    <View style={[styles.wrapper, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Colors.textSubtle}
        style={[
          styles.input,
          textInputProps.multiline ? styles.inputMultiline : undefined,
          error ? styles.inputError : undefined,
        ]}
        {...textInputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.xs,
  },
  label: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    fontWeight: '600',
    letterSpacing: 0.3,
    lineHeight: Typography.secondary.lineHeight,
  },
  input: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    minHeight: 54,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputMultiline: {
    minHeight: 108,
    paddingTop: Spacing.md,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  error: {
    color: Colors.danger,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
  helper: {
    color: Colors.textSubtle,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
});
