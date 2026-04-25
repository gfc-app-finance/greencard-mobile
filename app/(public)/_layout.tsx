import { Stack } from 'expo-router';

export default function PublicLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="signup-step1" options={{ headerShown: false }} />
      <Stack.Screen name="signup-step2" options={{ headerShown: false }} />
      <Stack.Screen name="signup-step3" options={{ headerShown: false }} />
      <Stack.Screen name="signup-step4" options={{ headerShown: false }} />
      <Stack.Screen name="signup-step5" options={{ headerShown: false }} />
      <Stack.Screen
        name="signup-step6"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="auth/confirm"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
