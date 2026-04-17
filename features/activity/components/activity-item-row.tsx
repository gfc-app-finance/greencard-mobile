import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppStatusChip } from '@/components/ui/app-status-chip';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { formatCurrencyAmount } from '@/lib/currency';
import {
  formatActivityListTimestamp,
  getActivityStatusTone,
} from '@/services/goova-app-state-service';
import type { AppActivityItem } from '@/types/fintech';

type ActivityItemRowProps = {
  activity: AppActivityItem;
  onPress?: () => void;
  compact?: boolean;
};

function buildAmountLabel(activity: AppActivityItem) {
  if (!activity.amount || !activity.currencyCode) {
    return null;
  }

  const formattedAmount = formatCurrencyAmount(activity.currencyCode, activity.amount);

  if (activity.tone === 'positive') {
    return `+${formattedAmount}`;
  }

  if (activity.tone === 'negative') {
    return `-${formattedAmount}`;
  }

  return formattedAmount;
}

export function ActivityItemRow({ activity, onPress, compact = false }: ActivityItemRowProps) {
  const amountLabel = buildAmountLabel(activity);
  const amountTextColor =
    activity.tone === 'positive' ? Colors.success : Colors.text;

  const content = (
    <>
      <View style={[styles.avatar, { backgroundColor: activity.avatarAccentColor }]}>
        <Text style={[styles.avatarText, activity.avatarTextColor ? { color: activity.avatarTextColor } : null]}>
          {activity.avatarText}
        </Text>
      </View>

      <View style={styles.copyColumn}>
        <View style={styles.topRow}>
          <View style={styles.titleGroup}>
            <Text numberOfLines={compact ? 2 : 1} style={styles.title}>
              {activity.title}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {activity.subtitle}
            </Text>
          </View>

          <View style={styles.metaColumn}>
            {amountLabel ? (
              <Text style={[styles.amountText, { color: amountTextColor }]}>
                {amountLabel}
              </Text>
            ) : null}
            <Text style={styles.dateText}>
              {formatActivityListTimestamp(activity.createdAt)}
            </Text>
          </View>
        </View>

        {!compact ? (
          <Text numberOfLines={2} style={styles.description}>
            {activity.description}
          </Text>
        ) : null}

        <View style={styles.footerRow}>
          <AppStatusChip label={activity.statusLabel} tone={getActivityStatusTone(activity.status)} />
        </View>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          compact ? styles.cardCompact : null,
          pressed ? styles.cardPressed : null,
        ]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.card, compact ? styles.cardCompact : null]}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.018,
    shadowRadius: 10,
  },
  cardCompact: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 40,
    justifyContent: 'center',
    marginTop: 2,
    width: 40,
  },
  avatarText: {
    color: Colors.text,
    fontSize: Typography.meta.fontSize,
    fontWeight: '700',
    lineHeight: Typography.meta.lineHeight,
  },
  copyColumn: {
    flex: 1,
    gap: 8,
  },
  topRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  titleGroup: {
    flex: 1,
    gap: 4,
    paddingRight: Spacing.xs,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 78,
  },
  dateText: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
    textAlign: 'right',
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  footerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-start',
  },
  amountText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
});
