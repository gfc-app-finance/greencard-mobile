import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { CurrencyAmountText } from '@/components/ui/currency-amount-text';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { PaymentRecord } from '@/types/payments';

import { usePaymentFlow } from '../providers/payment-flow-provider';

type QuickPaySearchSheetProps = {
  visible: boolean;
  onClose: () => void;
};

function buildSearchKey(payment: PaymentRecord) {
  return `${payment.recipientName}-${payment.type}`.toLowerCase();
}

export function QuickPaySearchSheet({ visible, onClose }: QuickPaySearchSheetProps) {
  const router = useRouter();
  const { recentPayments, seedDraftFromPayment } = usePaymentFlow();
  const [searchValue, setSearchValue] = useState('');

  const quickPayRecipients = useMemo(() => {
    const seen = new Set<string>();

    return recentPayments.filter((payment) => {
      const key = buildSearchKey(payment);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }, [recentPayments]);

  const filteredRecipients = useMemo(() => {
    const searchTerm = searchValue.trim().toLowerCase();

    if (!searchTerm) {
      return quickPayRecipients.slice(0, 8);
    }

    return quickPayRecipients.filter((payment) => {
      const haystack = [
        payment.recipientName,
        payment.recipientBankName,
        payment.destinationLabel,
        payment.typeLabel,
        payment.note,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    });
  }, [quickPayRecipients, searchValue]);

  const handleSelect = (payment: PaymentRecord) => {
    seedDraftFromPayment(payment);
    setSearchValue('');
    onClose();
    router.push(payment.type === 'bank' ? '/payments/bank' : '/payments/international');
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable
        onPress={() => {
          setSearchValue('');
          onClose();
        }}
        style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.shell}>
          <AppCard style={styles.card}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>Quick pay</Text>
                <Text style={styles.title}>Search recipient</Text>
                <Text style={styles.description}>
                  Jump into a prefilled payment form using a recent recipient.
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  setSearchValue('');
                  onClose();
                }}
                style={styles.closeButton}>
                <Feather color={Colors.text} name="x" size={20} />
              </Pressable>
            </View>

            <View style={styles.searchInputWrap}>
              <Feather color={Colors.textMuted} name="search" size={18} />
              <TextInput
                autoFocus
                onChangeText={setSearchValue}
                placeholder="Search name, bank, or destination"
                placeholderTextColor={Colors.textSubtle}
                style={styles.searchInput}
                value={searchValue}
              />
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.resultList}>
                {filteredRecipients.map((payment) => (
                  <Pressable
                    key={`${payment.id}-${payment.type}`}
                    onPress={() => handleSelect(payment)}
                    style={({ pressed }) => [styles.resultCard, pressed ? styles.resultCardPressed : null]}>
                    <View style={[styles.avatar, { backgroundColor: payment.avatarColor }]}>
                      <Text style={styles.avatarText}>{payment.avatarText}</Text>
                    </View>

                    <View style={styles.resultCopy}>
                      <Text numberOfLines={1} style={styles.resultName}>
                        {payment.recipientName}
                      </Text>
                      <Text numberOfLines={1} style={styles.resultMeta}>
                        {payment.typeLabel} - {payment.recipientBankName}
                      </Text>
                      <Text numberOfLines={1} style={styles.resultHint}>
                        Last used for {payment.destinationLabel}
                      </Text>
                    </View>

                    <View style={styles.resultAmount}>
                      <CurrencyAmountText
                        align="right"
                        color={Colors.text}
                        value={payment.displayAmount}
                        variant="card"
                      />
                      <Text style={styles.speedDialLabel}>Fast pay</Text>
                    </View>
                  </Pressable>
                ))}

                {!filteredRecipients.length ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No recipients found</Text>
                    <Text style={styles.emptyDescription}>
                      Try another search term or create a payment from the + button.
                    </Text>
                  </View>
                ) : null}
              </View>
            </ScrollView>
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
    alignSelf: 'stretch',
    maxWidth: 520,
    width: '100%',
  },
  card: {
    backgroundColor: Colors.surface,
    gap: Spacing.md,
    maxHeight: '82%',
  },
  headerRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  description: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  searchInputWrap: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  searchInput: {
    color: Colors.text,
    flex: 1,
    fontSize: 15,
    minHeight: 54,
  },
  resultList: {
    gap: Spacing.sm,
  },
  resultCard: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  resultCardPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  resultCopy: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  resultMeta: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  resultHint: {
    color: Colors.textSubtle,
    fontSize: 12,
  },
  resultAmount: {
    alignItems: 'flex-end',
    minWidth: 88,
  },
  speedDialLabel: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDescription: {
    color: Colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    textAlign: 'center',
  },
});
