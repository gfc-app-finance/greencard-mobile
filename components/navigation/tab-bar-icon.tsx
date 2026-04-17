import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/theme';

type TabBarIconProps = {
  name: ComponentProps<typeof Feather>['name'];
  color: string;
  size?: number;
  focused?: boolean;
};

export function TabBarIcon({
  name,
  color,
  size = 20,
  focused = false,
}: TabBarIconProps) {
  return (
    <View style={[styles.container, focused && styles.focused]}>
      <Feather name={name} color={color} size={size} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 30,
    justifyContent: 'center',
    width: 40,
  },
  focused: {
    backgroundColor: Colors.primarySoft,
    borderColor: 'rgba(15, 118, 110, 0.14)',
    borderWidth: 1,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.018,
    shadowRadius: 8,
  },
});
