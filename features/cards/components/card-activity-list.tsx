import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { formatActivityListTimestamp } from '@/services/goova-app-state-service';
import type { ManagedCardActivity } from '@/types/fintech';

type CardActivityListProps = {
  activities: ManagedCardActivity[];
};

function resolveActivityColor(status: ManagedCardActivity['status']) {
  if (status === 'approved') {
    return Colors.text;
  }

  if (status === 'declined') {
    return Colors.danger;
  }

  return Colors.textMuted;
}

export function CardActivityList({ activities }: CardActivityListProps) {
  if (!activities.length) {
    return null;
  }

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent card activity</Text>
        <Text style={styles.meta}>{activities.length} recent entries</Text>
      </View>

      <View style={styles.list}>
        {activities.map((item, index) => (
          <View
            key={item.id}
            style={[styles.row, index === activities.length - 1 ? styles.rowLast : null]}>
            <View style={styles.copy}>
              <Text style={styles.merchantName}>{item.merchantName}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>

            <View style={styles.metaColumn}>
              <Text style={[styles.amount, { color: resolveActivityColor(item.status) }]}>
                {item.amountDisplay}
              </Text>
              <Text style={styles.timestamp}>{formatActivityListTimestamp(item.createdAt)}</Text>
            </View>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  meta: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
  list: {
    backgroundColor: Colors.backgroundElevated,
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
    paddingVertical: Spacing.md,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  merchantName: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
    lineHeight: Typography.body.lineHeight,
  },
  description: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  metaColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: Typography.body.fontSize,
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    lineHeight: Typography.body.lineHeight,
  },
  timestamp: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
});
