import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import { PremiumScreenHeader } from '@/features/home/components/premium-screen-header';

const categoryBreakdown = [
  { label: 'Salary', share: '46%', tone: Colors.primaryStrong },
  { label: 'Client income', share: '34%', tone: Colors.secondary },
  { label: 'Transfers', share: '20%', tone: Colors.violet },
];

const savingsSignals = [
  'Round up incoming transfers into your UK Master’s Fund goal.',
  'Auto-set aside 18% of GBP income before spending starts.',
  'Sweep large USD receipts into a lower-volatility holding rule.',
];

export function AnalyticsOverview() {
  const router = useRouter();

  return (
    <AppScreen withTabBarOffset={false}>
      <View style={styles.screen}>
        <PremiumScreenHeader
          centered={false}
          onBackPress={() => router.back()}
          subtitle="See account trends, savings opportunities, and automated income sorting at a glance."
          title="Analytics"
          titleSize="display"
        />

        <AppCard style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>THIS MONTH</Text>
          <Text style={styles.heroMetric}>+18.4%</Text>
          <Text style={styles.heroLabel}>Net inflow vs last month</Text>

          <View style={styles.barRow}>
            <View style={[styles.bar, styles.barTall]} />
            <View style={[styles.bar, styles.barMedium]} />
            <View style={[styles.bar, styles.barShort]} />
            <View style={[styles.bar, styles.barTallest]} />
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Goal-based saving</Text>
          <Text style={styles.sectionDescription}>
            Suggested rules based on the rhythm of your recent income and transfer activity.
          </Text>

          <View style={styles.list}>
            {savingsSignals.map((signal) => (
              <View key={signal} style={styles.listRow}>
                <View style={styles.bullet} />
                <Text style={styles.listText}>{signal}</Text>
              </View>
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Automatic income sorting</Text>
          <Text style={styles.sectionDescription}>
            Incoming funds can be categorized automatically before you move them into budgets or goals.
          </Text>

          <View style={styles.categoryList}>
            {categoryBreakdown.map((category) => (
              <View key={category.label} style={styles.categoryRow}>
                <View style={styles.categoryMeta}>
                  <View style={[styles.categoryDot, { backgroundColor: category.tone }]} />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </View>
                <Text style={styles.categoryValue}>{category.share}</Text>
              </View>
            ))}
          </View>
        </AppCard>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.lg,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  heroEyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  heroMetric: {
    color: Colors.text,
    fontSize: 42,
    fontWeight: '800',
  },
  heroLabel: {
    color: Colors.textMuted,
    fontSize: 15,
  },
  barRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: Spacing.sm,
    height: 120,
    marginTop: Spacing.sm,
  },
  bar: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    flex: 1,
  },
  barShort: {
    height: 44,
  },
  barMedium: {
    height: 72,
  },
  barTall: {
    height: 96,
  },
  barTallest: {
    backgroundColor: Colors.primaryStrong,
    height: 118,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  sectionDescription: {
    color: Colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  list: {
    gap: Spacing.sm,
  },
  listRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  bullet: {
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    height: 8,
    marginTop: 8,
    width: 8,
  },
  listText: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  categoryList: {
    gap: Spacing.sm,
  },
  categoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryDot: {
    borderRadius: Radius.full,
    height: 10,
    width: 10,
  },
  categoryLabel: {
    color: Colors.text,
    fontSize: 16,
  },
  categoryValue: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});
