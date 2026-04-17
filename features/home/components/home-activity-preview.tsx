import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardActivityPreviewItem } from '@/types/dashboard';

type HomeActivityPreviewProps = {
  items: DashboardActivityPreviewItem[];
  onSeeAll?: () => void;
};

export function HomeActivityPreview({ items, onSeeAll }: HomeActivityPreviewProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Recent activity</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.sectionAction}>See all</Text>
        </Pressable>
      </View>

      <AppCard style={styles.card}>
        {items.map((item, index) => (
          <View
            key={item.id}
            style={[styles.row, index === items.length - 1 ? styles.rowLast : null]}>
            <View style={[styles.avatar, { backgroundColor: item.avatarAccentColor }]}>
              <Text style={[styles.avatarText, item.avatarTextColor ? { color: item.avatarTextColor } : null]}>
                {item.avatarText}
              </Text>
            </View>

            <View style={styles.copyBlock}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
              <Text style={styles.meta}>{item.meta}</Text>
            </View>

            <Text
              style={[
                styles.amount,
                item.tone === 'positive' ? styles.amountPositive : styles.amountNegative,
              ]}>
              {item.amount.replace('GBP', '£').replace('USD', '$').replace('EUR', 'EUR ')}
            </Text>
          </View>
        ))}
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  sectionAction: {
    color: Colors.primaryStrong,
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'rgba(27, 26, 44, 0.96)',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  row: {
    alignItems: 'center',
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  copyBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.74)',
    fontSize: 14,
  },
  meta: {
    color: Colors.textSubtle,
    fontSize: 13,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  amountPositive: {
    color: Colors.success,
  },
  amountNegative: {
    color: 'rgba(255, 255, 255, 0.92)',
  },
});
