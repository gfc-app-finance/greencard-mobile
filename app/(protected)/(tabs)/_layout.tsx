import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { protectedTabConfig } from '@/components/navigation/protected-tab-config';
import { TabBarIcon } from '@/components/navigation/tab-bar-icon';
import { Colors } from '@/constants/colors';
import { Layout, Radius, Spacing, Typography } from '@/constants/theme';

export default function ProtectedTabsLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBottomOffset = Math.max(
    Layout.tabBarBottomOffset,
    insets.bottom + Spacing.xs
  );
  const tabBarExtraInset = Math.max(0, insets.bottom - Spacing.xs);

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primaryStrong,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: Typography.micro.fontSize,
          fontWeight: '600',
          lineHeight: Typography.micro.lineHeight,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderColor: Colors.border,
          borderRadius: Radius.full,
          borderTopWidth: 1,
          bottom: tabBarBottomOffset,
          elevation: 0,
          height: Layout.tabBarHeight + tabBarExtraInset,
          left: Layout.screenPadding,
          overflow: 'hidden',
          paddingBottom: Platform.OS === 'ios' ? 14 + tabBarExtraInset : 12,
          paddingHorizontal: 14,
          paddingTop: 9,
          position: 'absolute',
          right: Layout.screenPadding,
          shadowColor: Colors.shadow,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.04,
          shadowRadius: 18,
        },
        tabBarItemStyle: {
          borderRadius: Radius.lg,
          marginHorizontal: 3,
          paddingHorizontal: 0,
          paddingVertical: 2,
        },
      }}>
      {protectedTabConfig.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon color={color} focused={focused} name={tab.iconName} />
            ),
          }}
        />
      ))}
      <Tabs.Screen
        name="cards"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
