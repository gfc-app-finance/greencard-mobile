import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';

import type { GlobalSearchResultItem } from './search-types';

type SearchResultRowProps = {
  result: GlobalSearchResultItem;
};

export function SearchResultRow({ result }: SearchResultRowProps) {
  return (
    <Pressable onPress={result.onPress} style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>
          {result.title}
        </Text>
        <Text numberOfLines={1} style={styles.subtitle}>
          {result.subtitle}
        </Text>
        {result.meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {result.meta}
          </Text>
        ) : null}
      </View>

      {result.accentLabel ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{result.accentLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  rowPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  meta: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  badge: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(31, 168, 154, 0.16)',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  badgeText: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
  },
});
