import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type MoveMoneyInfoDialogProps = {
  visible: boolean;
  activeAccount: DashboardAccount;
  onClose: () => void;
  onContinue: () => void;
};

type InfoRowProps = {
  label: string;
  value: string;
  accent?: boolean;
};

function InfoRow({ label, value, accent = false }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, accent ? styles.infoValueAccent : null]}>{value}</Text>
    </View>
  );
}

export function MoveMoneyInfoDialog({
  visible,
  activeAccount,
  onClose,
  onContinue,
}: MoveMoneyInfoDialogProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.shell}>
          <AppCard style={styles.card}>
            <Text style={styles.eyebrow}>Move money</Text>
            <Text style={styles.title}>Review transfer details first</Text>
            <Text style={styles.subtitle}>
              You will choose the destination account and amount next, but here is what to expect
              before you continue.
            </Text>

            <View style={styles.infoCard}>
              <InfoRow label="Transaction cost" value="Free" accent />
              <InfoRow label="Expected arrival" value="Usually instant" />
              <InfoRow label="Starting from" value={activeAccount.displayName} />
              <InfoRow label="FX conversion" value="Live rate shown before final review" />
              <InfoRow label="Next step" value="Choose the amount and destination account" />
            </View>

            <Text style={styles.caption}>
              If you move between different currencies, the app will show the rate and final receive
              amount before you confirm.
            </Text>

            <View style={styles.actions}>
              <AppButton
                containerStyle={styles.actionButton}
                onPress={onClose}
                title="Not now"
                variant="ghost"
              />
              <AppButton
                containerStyle={styles.actionButton}
                onPress={onContinue}
                title="Continue"
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
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(148, 163, 184, 0.14)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoRow: {
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    borderBottomWidth: 1,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    color: Colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  infoValue: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 21,
  },
  infoValueAccent: {
    color: Colors.success,
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
