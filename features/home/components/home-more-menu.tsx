import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/theme';
import type { DashboardAccount } from '@/types/dashboard';

type MoreMenuAction = {
  id: string;
  label: string;
  iconName: ComponentProps<typeof Feather>['name'];
};

type HomeMoreMenuProps = {
  visible: boolean;
  activeAccount: DashboardAccount;
  onClose: () => void;
  onActionPress: (actionId: string) => void;
};

const menuActions: MoreMenuAction[] = [
  {
    id: 'statement',
    label: 'Statement',
    iconName: 'file-text',
  },
  {
    id: 'converter',
    label: 'Converter',
    iconName: 'refresh-cw',
  },
  {
    id: 'theme',
    label: 'Theme',
    iconName: 'droplet',
  },
  {
    id: 'add-products',
    label: 'Add products & accounts',
    iconName: 'plus',
  },
];

export function HomeMoreMenu({
  visible,
  activeAccount,
  onClose,
  onActionPress,
}: HomeMoreMenuProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable onPress={onClose} style={styles.overlay}>
        <Pressable onPress={() => undefined} style={styles.shell}>
          <View style={styles.menu}>
            <Text style={styles.eyebrow}>{`${activeAccount.accountType} account`}</Text>
            <Text style={styles.title}>{activeAccount.displayName}</Text>

            <View style={styles.menuList}>
              {menuActions.map((action, index) => (
                <Pressable
                  key={action.id}
                  onPress={() => {
                    onActionPress(action.id);
                    onClose();
                  }}
                  style={[
                    styles.menuItem,
                    index === menuActions.length - 1 ? styles.menuItemLast : null,
                  ]}>
                  <View style={styles.menuIcon}>
                    <Feather color={Colors.primaryStrong} name={action.iconName} size={20} />
                  </View>
                  <Text style={styles.menuText}>{action.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(23, 23, 23, 0.18)',
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.lg,
  },
  shell: {
    alignSelf: 'stretch',
  },
  menu: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  eyebrow: {
    color: Colors.primaryStrong,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  menuList: {
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  menuText: {
    color: Colors.text,
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
});
