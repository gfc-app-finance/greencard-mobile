import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { SafeScreenContainer } from '@/components/ui/safe-screen-container';

type AppScreenProps = PropsWithChildren<{
  scrollable?: boolean;
  keyboardAware?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  withTabBarOffset?: boolean;
}>;

export function AppScreen({
  children,
  scrollable = true,
  keyboardAware = false,
  contentContainerStyle,
  withTabBarOffset = true,
}: AppScreenProps) {
  return (
    <SafeScreenContainer
      contentContainerStyle={contentContainerStyle}
      keyboardAware={keyboardAware}
      scrollable={scrollable}
      withTabBarOffset={withTabBarOffset}>
      {children}
    </SafeScreenContainer>
  );
}
