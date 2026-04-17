import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { AppScreen } from '@/components/ui/app-screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useGoovaAppState } from '@/features/app/providers/goova-app-state-provider';
import { PremiumScreenHeader } from '@/features/home/components/premium-screen-header';

import { TrendLineChart } from './trend-line-chart';

function formatTrendValue(value: number) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function AnalyticsOverviewScreen() {
  const router = useRouter();
  const { incomeSorting, savingsGoals } = useGoovaAppState();

  const trendSeries = useMemo(() => {
    const activeAllocation = incomeSorting.rules
      .filter((rule) => rule.enabled)
      .reduce((total, rule) => total + rule.allocationPercentage, 0);
    const baseline = [64, 67, 65, 71, 73, 76];
    const lift = Math.round((activeAllocation - 80) / 8);

    return baseline.map((point, index) => (index >= baseline.length - 2 ? point + lift : point));
  }, [incomeSorting.rules]);

  const monthlyTrend = useMemo(() => {
    if (trendSeries.length < 2 || trendSeries[0] === 0) {
      return 0;
    }

    return ((trendSeries[trendSeries.length - 1] - trendSeries[0]) / trendSeries[0]) * 100;
  }, [trendSeries]);

  const savingsSignals = useMemo(() => {
    if (!savingsGoals.length) {
      return ['No goals created yet. Open Savings to create your first time-bound goal plan.'];
    }

    return savingsGoals.slice(0, 3).map((goal) => {
      const targetDate = goal.targetDate
        ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
            new Date(goal.targetDate)
          )
        : 'No target date';
      return `${goal.name}: ${goal.savedAmount} of ${goal.targetAmount} · ${goal.progressPercentage}% · ${targetDate}`;
    });
  }, [savingsGoals]);

  const categoryBreakdown = useMemo(
    () =>
      incomeSorting.rules.map((rule) => ({
        id: rule.id,
        label: rule.label,
        share: `${rule.allocationPercentage}%`,
        tone: rule.accentColor,
        destination: rule.destinationGoalId
          ? savingsGoals.find((goal) => goal.id === rule.destinationGoalId)?.name || 'Goal destination'
          : 'Unassigned destination',
      })),
    [incomeSorting.rules, savingsGoals]
  );

  const trendMetricColor =
    monthlyTrend > 0 ? Colors.success : monthlyTrend < 0 ? Colors.danger : Colors.primaryStrong;

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
          <Text style={[styles.heroMetric, { color: trendMetricColor }]}>{formatTrendValue(monthlyTrend)}</Text>
          <Text style={styles.heroLabel}>Net inflow vs last month</Text>

          <View style={styles.chartWrap}>
            <TrendLineChart data={trendSeries} labels={['W1', 'W2', 'W3', 'W4', 'W5', 'Now']} />
          </View>
        </AppCard>

        <AppCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goal-based saving</Text>
            <AppButton
              containerStyle={styles.inlineButton}
              onPress={() => router.push('/savings' as never)}
              title="Open savings"
              variant="secondary"
            />
          </View>
          <Text style={styles.sectionDescription}>
            Time-bound goal performance across your active plan and automated saving cadence.
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
            Incoming funds are categorized with live split rules before being routed to destinations.
          </Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>
              Auto sorting: {incomeSorting.enabled ? 'Enabled' : 'Disabled'}
            </Text>
            <Text style={styles.statusMeta}>
              Trigger from {incomeSorting.currencyCode} {incomeSorting.minimumTriggerAmount.toFixed(0)}
            </Text>
          </View>

          <View style={styles.categoryList}>
            {categoryBreakdown.map((category) => (
              <View key={category.id} style={styles.categoryRow}>
                <View style={styles.categoryMeta}>
                  <View style={[styles.categoryDot, { backgroundColor: category.tone }]} />
                  <View style={styles.categoryCopy}>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryDestination}>{category.destination}</Text>
                  </View>
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
    fontSize: Typography.micro.fontSize,
    fontWeight: '700',
    letterSpacing: Typography.micro.letterSpacing,
    lineHeight: Typography.micro.lineHeight,
  },
  heroMetric: {
    fontSize: Typography.display.fontSize,
    fontWeight: '800',
    letterSpacing: Typography.display.letterSpacing,
    lineHeight: Typography.display.lineHeight,
  },
  heroLabel: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
  },
  chartWrap: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  inlineButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  sectionTitle: {
    color: Colors.text,
    flex: 1,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  sectionDescription: {
    color: Colors.textMuted,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
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
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  statusRow: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  statusLabel: {
    color: Colors.text,
    fontSize: Typography.secondary.fontSize,
    fontWeight: '700',
    lineHeight: Typography.secondary.lineHeight,
  },
  statusMeta: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    fontWeight: '600',
    lineHeight: Typography.meta.lineHeight,
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
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  categoryDot: {
    borderRadius: Radius.full,
    height: 10,
    width: 10,
  },
  categoryCopy: {
    flex: 1,
    gap: 2,
  },
  categoryLabel: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
  },
  categoryDestination: {
    color: Colors.textSubtle,
    fontSize: Typography.meta.fontSize,
    lineHeight: Typography.meta.lineHeight,
  },
  categoryValue: {
    color: Colors.text,
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
    lineHeight: Typography.body.lineHeight,
  },
});
