import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { IncomeSortingRule } from '@/types/fintech';

type IncomeSortingRuleRowProps = {
  rule: IncomeSortingRule;
  destinationLabel: string;
  onIncrease: () => void;
  onDecrease: () => void;
  onToggleEnabled: () => void;
  onCycleDestination: () => void;
};

export function IncomeSortingRuleRow({
  rule,
  destinationLabel,
  onIncrease,
  onDecrease,
  onToggleEnabled,
  onCycleDestination,
}: IncomeSortingRuleRowProps) {
  return (
    <View style={[styles.row, !rule.enabled ? styles.rowDisabled : null]}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: rule.accentColor }]} />
        <View style={styles.copy}>
          <Text style={styles.label}>{rule.label}</Text>
          <Pressable onPress={onCycleDestination} style={styles.destinationChip}>
            <Text style={styles.destinationText}>{destinationLabel}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable onPress={onToggleEnabled} style={[styles.toggle, rule.enabled ? styles.toggleOn : null]}>
          <Text style={[styles.toggleLabel, rule.enabled ? styles.toggleLabelOn : null]}>
            {rule.enabled ? 'On' : 'Off'}
          </Text>
        </Pressable>

        <View style={styles.stepper}>
          <Pressable onPress={onDecrease} style={styles.stepButton}>
            <Text style={styles.stepText}>-</Text>
          </Pressable>
          <Text style={styles.value}>{rule.allocationPercentage}%</Text>
          <Pressable onPress={onIncrease} style={styles.stepButton}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  rowDisabled: {
    opacity: 0.65,
  },
  left: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dot: {
    borderRadius: Radius.full,
    height: 10,
    width: 10,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  label: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  destinationChip: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
  },
  destinationText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  controls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  toggle: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  toggleOn: {
    backgroundColor: 'rgba(43, 182, 115, 0.12)',
    borderColor: 'rgba(43, 182, 115, 0.18)',
  },
  toggleLabel: {
    color: Colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  toggleLabelOn: {
    color: Colors.success,
  },
  stepper: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
  },
  stepButton: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  stepText: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  value: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '700',
    minWidth: 42,
    textAlign: 'center',
  },
});
