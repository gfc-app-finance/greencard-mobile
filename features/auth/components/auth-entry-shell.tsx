import type { PropsWithChildren } from 'react';
import { type StyleProp, StyleSheet, type ViewStyle } from 'react-native';

import { SafeScreenContainer } from '@/components/ui/safe-screen-container';

type AuthEntryShellProps = PropsWithChildren<{
  scrollable?: boolean;
  keyboardAware?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
}>;

export function AuthEntryShell({
  children,
  scrollable = true,
  keyboardAware = false,
  contentContainerStyle,
}: AuthEntryShellProps) {
  return (
    <SafeScreenContainer
      contentContainerStyle={[
        styles.content,
        scrollable ? styles.scrollContent : styles.staticContent,
        contentContainerStyle,
      ]}
      keyboardAware={keyboardAware}
      scrollable={scrollable}
    >
      {children}
    </SafeScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: '100%',
  },
  scrollContent: {
    justifyContent: 'center',
  },
  staticContent: {
    flex: 1,
  },
});
