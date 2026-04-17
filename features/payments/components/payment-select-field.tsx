import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type PaymentSelectFieldProps = {
  label: string;
  value?: string;
  placeholder: string;
  helperText?: string;
  error?: string;
  onPress: () => void;
};

export function PaymentSelectField({
  label,
  value,
  placeholder,
  helperText,
  error,
  onPress,
}: PaymentSelectFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={onPress} style={[styles.field, error ? styles.fieldError : null]}>
        <Text style={value ? styles.value : styles.placeholder}>{value || placeholder}</Text>
        <Feather color={Colors.textMuted} name="chevron-down" size={18} />
      </Pressable>
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
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  field: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
    paddingHorizontal: Spacing.md,
  },
  fieldError: {
    borderColor: Colors.danger,
  },
  value: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    paddingRight: Spacing.sm,
  },
  placeholder: {
    color: Colors.textSubtle,
    flex: 1,
    fontSize: 15,
    paddingRight: Spacing.sm,
  },
  helper: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  error: {
    color: Colors.danger,
    fontSize: 12,
  },
});
