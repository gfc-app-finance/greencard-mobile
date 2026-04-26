import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';

const VerificationProvider = ({ children }: any) => <>{children}</>;
const GoovaAppStateProvider = ({ children }: any) => <>{children}</>;
const PaymentFlowProvider = ({ children }: any) => <>{children}</>;

export default function ProtectedLayout() {
  return (
    <VerificationProvider>
      <GoovaAppStateProvider>
        <PaymentFlowProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </PaymentFlowProvider>
      </GoovaAppStateProvider>
    </VerificationProvider>
  );
}
