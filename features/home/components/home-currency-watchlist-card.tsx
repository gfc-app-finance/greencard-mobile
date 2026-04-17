import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { DashboardAccount, DashboardCurrencyWatchItem } from '@/types/dashboard';

type HomeCurrencyWatchlistCardProps = {
  account: DashboardAccount;
  items: DashboardCurrencyWatchItem[];
  onOpenConverter?: () => void;
};

export function HomeCurrencyWatchlistCard({
  account,
  items,
  onOpenConverter,
}: HomeCurrencyWatchlistCardProps) {
  if (!items.length) {
    return null;
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.copyBlock}>
          <Text style={styles.eyebrow}>DAILY WATCHLIST</Text>
          <Text style={styles.title}>{`${account.currencyCode} conversion watch`}</Text>
          <Text style={styles.subtitle}>
            Track daily rates before you move money into this wallet.
          </Text>
        </View>

        {onOpenConverter ? (
          <Pressable
            onPress={onOpenConverter}
            style={({ pressed }) => [styles.convertButton, pressed && styles.pressed]}>
            <Text style={styles.convertButtonText}>Convert</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.list}>
        {items.map((item, index) => {
          const directionColor =
            item.direction === 'up'
              ? Colors.success
              : item.direction === 'down'
                ? Colors.danger
                : Colors.textMuted;
          const directionIcon =
            item.direction === 'up'
              ? 'trending-up'
              : item.direction === 'down'
                ? 'trending-down'
                : 'minus';

          return (
            <View
              key={item.id}
              style={[styles.row, index === items.length - 1 ? styles.rowLast : null]}>
              <View style={styles.rowLeft}>
                <View
                  style={[
                    styles.currencyBadge,
                    { backgroundColor: account.accentSoftColor },
                  ]}>
                  <Text style={[styles.currencyBadgeText, { color: account.accentColor }]}>
                    {item.baseCurrencyCode}
                  </Text>
                </View>

                <View style={styles.rowCopy}>
                  <Text style={styles.currencyName}>{item.baseCurrencyLabel}</Text>
                  <Text style={styles.pairLabel}>
                    {`${item.baseCurrencyCode} to ${item.quoteCurrencyCode}`}
                  </Text>
                </View>
              </View>

              <View style={styles.rowRight}>
                <Text style={styles.rateText}>{item.displayRate}</Text>
                <View style={styles.changeRow}>
                  <Feather color={directionColor} name={directionIcon} size={14} />
                  <Text style={[styles.changeText, { color: directionColor }]}>
                    {item.dailyChangeDisplay}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.lg,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copyBlock: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Colors.textSubtle,
    fontSize: Typography.micro.fontSize,
    fontWeight: '700',
    letterSpacing: Typography.micro.letterSpacing,
    lineHeight: Typography.micro.lineHeight,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  convertButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 38,
    minWidth: 88,
    paddingHorizontal: 14,
  },
  convertButtonText: {
    color: Colors.primaryStrong,
    fontSize: Typography.secondary.fontSize,
    fontWeight: '600',
    lineHeight: Typography.secondary.lineHeight,
  },
  list: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 15,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  currencyBadge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  currencyBadgeText: {
    fontSize: Typography.meta.fontSize,
    fontWeight: '800',
    letterSpacing: 0.6,
    lineHeight: Typography.meta.lineHeight,
  },
  rowCopy: {
    flex: 1,
    gap: 4,
  },
  currencyName: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  pairLabel: {
    color: Colors.textMuted,
    fontSize: Typography.meta.fontSize,
    fontWeight: '500',
    lineHeight: Typography.meta.lineHeight,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rateText: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    lineHeight: Typography.body.lineHeight,
  },
  changeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  changeText: {
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    lineHeight: Typography.meta.lineHeight,
  },
  pressed: {
    opacity: 0.9,
  },
});
