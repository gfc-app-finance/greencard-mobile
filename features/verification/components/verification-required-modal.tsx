import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { RestrictedFeatureCopy } from '@/features/verification/verification-access';

type VerificationRequiredModalProps = {
  visible: boolean;
  copy: RestrictedFeatureCopy | null;
  onClose: () => void;
  onVerifyNow: () => void;
};

export function VerificationRequiredModal({
  visible,
  copy,
  onClose,
  onVerifyNow,
}: VerificationRequiredModalProps) {
  if (!copy) {
    return null;
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.shell}>
          <AppCard style={styles.card}>
            <View style={styles.iconWrap}>
              <Feather color={Colors.primaryStrong} name="lock" size={22} />
            </View>

            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.description}>{copy.description}</Text>

            <View style={styles.actions}>
              <AppButton onPress={onClose} title="Maybe later" variant="ghost" />
              <AppButton onPress={onVerifyNow} title={copy.ctaLabel} />
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
    backgroundColor: 'rgba(23, 23, 23, 0.14)',
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  shell: {
    width: '100%',
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  title: {
    color: Colors.text,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 28,
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
