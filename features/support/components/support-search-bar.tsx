import { Feather } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

type SupportSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
};

export function SupportSearchBar({
  value,
  onChangeText,
}: SupportSearchBarProps) {
  return (
    <View style={styles.container}>
      <Feather color={Colors.textSubtle} name="search" size={18} />
      <TextInput
        onChangeText={onChangeText}
        placeholder="Search help topics"
        placeholderTextColor={Colors.textSubtle}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    minHeight: 56,
    paddingHorizontal: Spacing.md,
  },
  input: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.sm,
  },
});
