import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type MoveMoneyReviewDialogProps = {
  visible: boolean;
  sourceAccount: DashboardAccount;
  destinationAccount: DashboardAccount;
  sourceAmountLabel: string;
  destinationAmountLabel: string;
  feeLabel: string;
  arrivalLabel: string;
  rateLabel: string;
  note?: string;
  onClose: () => void;
  onConfirm: () => void;
};

type DetailRowProps = {
  label: string;
  value: string;
  valueColor?: string;
};

function DetailRow({ label, value, valueColor = Colors.text }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export function MoveMoneyReviewDialog({
  visible,
  sourceAccount,
  destinationAccount,
  sourceAmountLabel,
  destinationAmountLabel,
  feeLabel,
  arrivalLabel,
  rateLabel,
  note,
  onClose,
  onConfirm,
}: MoveMoneyReviewDialogProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.shell}>
          <AppCard style={styles.card}>
            <Text style={styles.eyebrow}>Review transfer</Text>
            <Text style={styles.title}>{`${sourceAccount.currencyCode} to ${destinationAccount.currencyCode}`}</Text>
            <Text style={styles.subtitle}>
              Check the fee, route, and arrival details before you continue.
            </Text>

            <View style={styles.amountSummary}>
              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>You send</Text>
                <CurrencyAmountText
                  color={Colors.white}
                  value={sourceAmountLabel}
                  variant="card"
                />
                <Text style={styles.amountHint}>{sourceAccount.displayName}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.amountBlock}>
                <Text style={styles.amountLabel}>Recipient gets</Text>
                <CurrencyAmountText
                  color={Colors.white}
                  value={destinationAmountLabel}
                  variant="card"
                />
                <Text style={styles.amountHint}>{destinationAccount.displayName}</Text>
              </View>
            </View>

            <View style={styles.detailsCard}>
              <DetailRow label="Transaction cost" value={feeLabel} valueColor={Colors.success} />
              <DetailRow label="FX rate" value={rateLabel} />
              <DetailRow label="Expected arrival" value={arrivalLabel} />
              <DetailRow label="From" value={sourceAccount.displayName} />
              <DetailRow label="To" value={destinationAccount.displayName} />
              {note?.trim() ? <DetailRow label="Note" value={note.trim()} /> : null}
            </View>

            <Text style={styles.caption}>
              Transfers between your GCF balances usually settle instantly when both accounts are
              active.
            </Text>

            <View style={styles.actions}>
              <AppButton
                containerStyle={styles.actionButton}
                onPress={onClose}
                title="Edit transfer"
                variant="ghost"
              />
              <AppButton
                containerStyle={styles.actionButton}
                onPress={onConfirm}
                title="Confirm transfer"
                variant="secondary"
              />
            </View>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(3, 8, 20, 0.72)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  shell: {
    alignSelf: 'stretch',
    maxWidth: 460,
    width: '100%',
  },
  card: {
    backgroundColor: 'rgba(10, 18, 32, 0.98)',
    gap: Spacing.md,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.white,
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  amountSummary: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(148, 163, 184, 0.14)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.md,
  },
  amountBlock: {
    gap: 6,
  },
  amountLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  amountHint: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    height: 1,
  },
  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(148, 163, 184, 0.14)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailRow: {
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    borderBottomWidth: 1,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  detailLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  caption: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
