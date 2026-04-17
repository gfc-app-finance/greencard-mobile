import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { SectionHeader } from '@/components/ui/section-header';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { ActivityItemRow } from '@/features/activity/components/activity-item-row';
import type { AppActivityItem } from '@/types/fintech';

type HomeActivityPanelProps = {
  items: AppActivityItem[];
  onSeeAll?: () => void;
  onItemPress?: (itemId: string) => void;
};

export function HomeActivityPanel({ items, onSeeAll, onItemPress }: HomeActivityPanelProps) {
  return (
    <View style={styles.section}>
      <SectionHeader actionLabel="See all" onActionPress={onSeeAll} title="Recent activity" />

      <AppCard style={styles.card}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.row, index === items.length - 1 ? styles.rowLast : null]}>
            <ActivityItemRow
              activity={item}
              compact
              onPress={onItemPress ? () => onItemPress(item.id) : undefined}
            />
          </View>
        ))}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 0,
    paddingVertical: 0,
    shadowOpacity: 0.028,
    shadowRadius: 14,
  },
  row: {
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
});
