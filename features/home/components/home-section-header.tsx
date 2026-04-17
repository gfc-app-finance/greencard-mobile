import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

type HomeSectionHeaderProps = {
  title: string;
  actionLabel?: string;
};

export function HomeSectionHeader({
  title,
  actionLabel,
}: HomeSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
  },
  action: {
    color: Colors.primaryStrong,
    fontSize: 13,
    fontWeight: '700',
  },
});
