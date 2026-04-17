import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { PaymentTimelineStep } from '@/types/payments';

type PaymentTrackerProps = {
  steps: PaymentTimelineStep[];
};

export function PaymentTracker({ steps }: PaymentTrackerProps) {
  return (
    <View style={styles.tracker}>
      {steps.map((step, index) => {
        const isPending = step.state === 'pending';
        const isCurrent = step.state === 'current';

        return (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.railColumn}>
              <View
                style={[
                  styles.dot,
                  isPending ? styles.dotPending : isCurrent ? styles.dotCurrent : styles.dotCompleted,
                ]}
              />
              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.rail,
                    isPending ? styles.railPending : styles.railCompleted,
                  ]}
                />
              ) : null}
            </View>

            <View style={styles.copyColumn}>
              <View style={styles.stepHeader}>
                <Text style={[styles.label, isPending ? styles.labelPending : null]}>
                  {step.label}
                </Text>
                {step.timestamp ? <Text style={styles.timestamp}>{step.timestamp}</Text> : null}
              </View>
              <Text style={[styles.description, isPending ? styles.descriptionPending : null]}>
                {step.description}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tracker: {
    gap: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  railColumn: {
    alignItems: 'center',
    width: 22,
  },
  dot: {
    borderRadius: Radius.full,
    height: 14,
    width: 14,
  },
  dotCompleted: {
    backgroundColor: Colors.success,
  },
  dotCurrent: {
    backgroundColor: Colors.primaryStrong,
    shadowColor: Colors.primaryStrong,
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  dotPending: {
    backgroundColor: 'rgba(166, 183, 190, 0.22)',
    borderColor: 'rgba(166, 183, 190, 0.3)',
    borderWidth: 1,
  },
  rail: {
    marginTop: 6,
    minHeight: 52,
    width: 2,
  },
  railCompleted: {
    backgroundColor: 'rgba(43, 182, 115, 0.32)',
  },
  railPending: {
    backgroundColor: 'rgba(166, 183, 190, 0.14)',
  },
  copyColumn: {
    flex: 1,
    gap: 4,
    paddingBottom: Spacing.sm,
  },
  stepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  labelPending: {
    color: Colors.textMuted,
  },
  timestamp: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  descriptionPending: {
    color: Colors.textSubtle,
  },
});
