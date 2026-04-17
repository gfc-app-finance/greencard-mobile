import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { SavingsGoal } from '@/types/dashboard';

type SavingsGoalCardProps = {
  goal: SavingsGoal;
};

export function SavingsGoalCard({ goal }: SavingsGoalCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text style={styles.label}>Featured goal</Text>
          <Text style={styles.title}>{goal.name}</Text>
        </View>

        <View style={styles.percentageChip}>
          <Text style={styles.percentageText}>{goal.progressPercentage}%</Text>
        </View>
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.savedAmount}>{goal.savedAmount}</Text>
        <Text style={styles.targetAmount}>of {goal.targetAmount}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${goal.progressPercentage}%` }]} />
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.note}>{goal.note}</Text>
        <Text style={styles.cadence}>{goal.cadenceLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  percentageChip: {
    backgroundColor: Colors.violetSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
  },
  percentageText: {
    color: Colors.violet,
    fontSize: 12,
    fontWeight: '800',
  },
  amountRow: {
    alignItems: 'baseline',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  savedAmount: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  targetAmount: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  progressTrack: {
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    height: 10,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: Colors.primaryStrong,
    borderRadius: Radius.full,
    height: '100%',
  },
  metaRow: {
    gap: 6,
  },
  note: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  cadence: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
