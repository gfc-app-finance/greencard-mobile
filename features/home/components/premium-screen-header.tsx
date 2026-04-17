import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

type PremiumScreenHeaderProps = {
  title: string;
  subtitle?: string;
  centered?: boolean;
  titleSize?: 'default' | 'display';
  onBackPress: () => void;
};

export function PremiumScreenHeader({
  title,
  subtitle,
  centered = true,
  titleSize = 'default',
  onBackPress,
}: PremiumScreenHeaderProps) {
  return (
    <View style={[styles.row, centered ? styles.rowCentered : null]}>
      <Pressable onPress={onBackPress} style={styles.backButton}>
        <Feather color={Colors.text} name="arrow-left" size={24} />
      </Pressable>

      <View style={[styles.copyBlock, centered ? styles.copyBlockCentered : null]}>
        <Text
          style={[
            styles.title,
            titleSize === 'display' ? styles.titleDisplay : null,
            centered ? styles.titleCentered : null,
          ]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, centered ? styles.subtitleCentered : null]}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.trailingSpace, centered ? null : styles.trailingSpaceCollapsed]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    minHeight: 56,
  },
  rowCentered: {
    justifyContent: 'space-between',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.018,
    shadowRadius: 10,
    width: 46,
  },
  copyBlock: {
    flex: 1,
    marginLeft: Spacing.xs,
  },
  copyBlockCentered: {
    marginLeft: 0,
  },
  title: {
    color: Colors.text,
    fontSize: Typography.sectionTitle.fontSize,
    fontWeight: '700',
    lineHeight: Typography.sectionTitle.lineHeight,
  },
  titleDisplay: {
    fontSize: Typography.screenTitle.fontSize,
    fontWeight: '800',
    letterSpacing: Typography.screenTitle.letterSpacing,
    lineHeight: Typography.screenTitle.lineHeight,
  },
  titleCentered: {
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: Typography.secondary.fontSize,
    lineHeight: Typography.secondary.lineHeight,
    marginTop: 4,
  },
  subtitleCentered: {
    textAlign: 'center',
  },
  trailingSpace: {
    width: 46,
  },
  trailingSpaceCollapsed: {
    width: 0,
  },
});
