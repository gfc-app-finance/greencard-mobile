import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

type HomeToolbarAction = {
  id: string;
  iconName: ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
  accent?: boolean;
};

type HomeToolbarProps = {
  avatarInitials: string;
  onAvatarPress?: () => void;
  onSearchPress?: () => void;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: HomeToolbarAction[];
};

export function HomeToolbar({
  avatarInitials,
  onAvatarPress,
  onSearchPress,
  searchPlaceholder = 'Search people to pay',
  searchValue = '',
  onSearchChange,
  actions = [],
}: HomeToolbarProps) {
  const handleSearchChange = (value: string) => {
    onSearchChange?.(value);

    if (value.trim().length > 0) {
      onSearchPress?.();
    }
  };

  return (
    <View style={styles.row}>
      <Pressable onPress={onAvatarPress} style={styles.avatarShell}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarInitials}</Text>
        </View>
        <View style={styles.avatarDot} />
      </Pressable>

      <View style={styles.searchBar}>
        <Feather color={Colors.text} name="search" size={22} />
        <TextInput
          onChangeText={handleSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
          style={styles.searchInput}
          value={searchValue}
        />
      </View>

      {actions.map((action) => (
        <Pressable
          key={action.id}
          onPress={action.onPress}
          style={[styles.utilityButton, action.accent ? styles.utilityButtonAccent : null]}>
          <Feather
            color={action.accent ? Colors.primaryStrong : Colors.text}
            name={action.iconName}
            size={22}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  avatarShell: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.16)',
    height: 48,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    width: 48,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '700',
    lineHeight: Typography.bodyLarge.lineHeight,
  },
  avatarDot: {
    backgroundColor: Colors.danger,
    borderRadius: Radius.full,
    borderColor: Colors.surface,
    borderWidth: 2,
    height: 10,
    position: 'absolute',
    right: 5,
    top: 5,
    width: 10,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    height: 50,
    paddingHorizontal: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.022,
    shadowRadius: 12,
  },
  searchInput: {
    color: Colors.text,
    flex: 1,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    minHeight: 40,
    paddingVertical: 0,
  },
  utilityButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 50,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.018,
    shadowRadius: 10,
    width: 50,
  },
  utilityButtonAccent: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(15, 118, 110, 0.14)',
  },
});
