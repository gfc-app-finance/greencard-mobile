import '@/global.css';

import { Stack } from 'expo-router';
import { View } from 'react-native';
import { configureReanimatedLogger } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

configureReanimatedLogger({ strict: false });

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0A0A0A' },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(protected)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </SafeAreaProvider>
  );
}
