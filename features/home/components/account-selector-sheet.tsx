import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type AccountSelectorSheetProps = {
  visible: boolean;
  title: string;
  accounts: DashboardAccount[];
  selectedAccountId: string;
  onSelect: (accountId: string) => void;
  onClose: () => void;
};

export function AccountSelectorSheet({
  visible,
  title,
  accounts,
  selectedAccountId,
  onSelect,
  onClose,
}: AccountSelectorSheetProps) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined}>
          <AppCard style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.list}>
              {accounts.map((account) => {
                const isSelected = account.id === selectedAccountId;

                return (
                  <Pressable
                    key={account.id}
                    onPress={() => {
                      onSelect(account.id);
                      onClose();
                    }}
                    style={[styles.item, isSelected ? styles.itemSelected : null]}>
                    <View style={[styles.currencyBadge, { backgroundColor: account.accentSoftColor }]}>
                      <Text style={[styles.currencyText, { color: account.accentColor }]}>
                        {account.currencyCode}
                      </Text>
                    </View>

                    <View style={styles.copyBlock}>
                      <Text style={styles.itemTitle}>{account.displayName}</Text>
                      <Text style={styles.itemSubtitle}>{account.balance}</Text>
                    </View>
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
    backgroundColor: 'rgba(23, 23, 23, 0.14)',
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
  list: {
    gap: Spacing.sm,
  },
  item: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  itemSelected: {
    borderColor: Colors.border,
    backgroundColor: Colors.primarySoft,
  },
  currencyBadge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '800',
  },
  copyBlock: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});
