import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { SavingsGoal } from '@/types/dashboard';

type SavingsGoalPlanCardProps = {
  goal: SavingsGoal;
};

function formatGoalTargetDate(value: string | undefined) {
  if (!value) {
    return 'No target date set';
  }

  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );
}

export function SavingsGoalPlanCard({ goal }: SavingsGoalPlanCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.title}>{goal.name}</Text>
          <Text style={styles.targetDate}>Target date: {formatGoalTargetDate(goal.targetDate)}</Text>
        </View>

        <View style={styles.progressChip}>
          <Text style={styles.progressChipText}>{goal.progressPercentage}%</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.savedAmount}>{goal.savedAmount}</Text>
        <Text style={styles.targetAmount}>of {goal.targetAmount}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${goal.progressPercentage}%` }]} />
      </View>

      <Text style={styles.note}>{goal.note}</Text>
      <Text style={styles.cadence}>{goal.cadenceLabel}</Text>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    gap: Spacing.sm,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  targetDate: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  progressChip: {
    backgroundColor: Colors.violetSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
  },
  progressChipText: {
    color: Colors.violet,
    fontSize: 12,
    fontWeight: '700',
  },
  amountRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    gap: 6,
  },
  savedAmount: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  targetAmount: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: 'rgba(166, 183, 190, 0.14)',
    borderRadius: Radius.full,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    height: '100%',
  },
  note: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cadence: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
