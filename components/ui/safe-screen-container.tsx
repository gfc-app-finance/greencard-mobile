import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Layout, Spacing } from '@/constants/theme';

type SafeScreenContainerProps = PropsWithChildren<{
  scrollable?: boolean;
  keyboardAware?: boolean;
  withTabBarOffset?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function SafeScreenContainer({
  children,
  scrollable = true,
  keyboardAware = false,
  withTabBarOffset = false,
  contentContainerStyle,
}: SafeScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const extraTopSpacing = insets.top > 20 ? Spacing.xs : 0;
  const extraBottomSpacing = insets.bottom > 0 ? Spacing.sm : 0;
  const tabBarClearance = withTabBarOffset
    ? Layout.tabBarHeight +
      Math.max(Layout.tabBarBottomOffset, insets.bottom + Spacing.xs) +
      Spacing.sm
    : 0;
  const safeSpacingStyle = {
    paddingBottom:
      Layout.screenBottomPadding +
      extraBottomSpacing +
      tabBarClearance,
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout.screenTopPadding + extraTopSpacing,
  };

  const innerContentStyle = [
    styles.innerContent,
    scrollable ? styles.innerScrollContent : styles.innerStaticContent,
    contentContainerStyle,
  ];

  const content = scrollable ? (
    <ScrollView
      automaticallyAdjustKeyboardInsets={keyboardAware}
      automaticallyAdjustsScrollIndicatorInsets={keyboardAware}
      contentContainerStyle={[styles.scrollOuterContent, safeSpacingStyle]}
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={innerContentStyle}>{children}</View>
    </ScrollView>
  ) : (
    <View style={[styles.staticOuterContent, safeSpacingStyle]}>
      <View style={innerContentStyle}>{children}</View>
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={styles.safeArea}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}>
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.background,
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scrollOuterContent: {
    flexGrow: 1,
  },
  staticOuterContent: {
    flex: 1,
  },
  innerContent: {
    gap: Spacing.lg,
  },
  innerScrollContent: {
    flexGrow: 1,
  },
  innerStaticContent: {
    flex: 1,
  },
});
