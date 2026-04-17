import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { DashboardQuickAction } from '@/types/dashboard';

import { AccountActionButton } from './account-action-button';

type HomeQuickActionsRowProps = {
  actions: DashboardQuickAction[];
  lockedActionIds?: string[];
  onActionPress: (actionId: string) => void;
};

export function HomeQuickActionsRow({
  actions,
  lockedActionIds = [],
  onActionPress,
}: HomeQuickActionsRowProps) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <AccountActionButton
          key={action.id}
          action={action}
          locked={lockedActionIds.includes(action.id)}
          onPress={() => onActionPress(action.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
});
