import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { PaymentFieldOption } from '@/types/payments';

type PaymentOptionSheetProps = {
  visible: boolean;
  title: string;
  options: PaymentFieldOption[];
  selectedId?: string;
  onSelect: (optionId: string) => void;
  onClose: () => void;
};

export function PaymentOptionSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: PaymentOptionSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined}>
          <AppCard style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.optionList}>
              {options.map((option) => {
                const isSelected = option.id === selectedId;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => {
                      onSelect(option.id);
                      onClose();
                    }}
                    style={[styles.option, isSelected ? styles.optionSelected : null]}>
                    <View style={styles.copyBlock}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      {option.description ? (
                        <Text style={styles.optionDescription}>{option.description}</Text>
                      ) : null}
                    </View>
                    {option.accentLabel ? (
                      <Text style={styles.accentLabel}>{option.accentLabel}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(23, 23, 23, 0.16)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  optionList: {
    gap: Spacing.sm,
  },
  option: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  optionSelected: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.border,
  },
  copyBlock: {
    flex: 1,
    gap: 3,
  },
  optionLabel: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    color: Colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  accentLabel: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
