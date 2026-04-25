import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { supabase } from '@/lib/supabase';

const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  return isAuthenticated;
};

export default function ProtectedLayout() {
  const isAuthenticated = useAuth();

  if (isAuthenticated === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0A0A0A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#0F766E" />
        <Text
          style={{
            color: 'white',
            marginTop: 20,
            fontWeight: '600',
            opacity: 0.5,
            letterSpacing: 1,
          }}
        >
          SECURE ACCESS...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(public)/login" />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#000000' }, // Deep Black Header
          headerTintColor: '#FFFFFF', // White Back Arrow/Text
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#FFFFFF' }, // Pure White Body
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        <Stack.Screen name="activity/[activityId]" options={{ title: 'Transaction' }} />
        <Stack.Screen name="payments/bank" options={{ title: 'Transfer' }} />
        <Stack.Screen name="payments/international" options={{ title: 'Global' }} />
        <Stack.Screen name="payments/new" options={{ title: 'New Payment' }} />
        <Stack.Screen name="payments/review" options={{ title: 'Review' }} />
        <Stack.Screen
          name="payments/success"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />

        <Stack.Screen name="account-details" options={{ title: 'My Details' }} />
        <Stack.Screen name="add-money" options={{ title: 'Add Funds' }} />
        <Stack.Screen name="analytics" options={{ title: 'Insights' }} />
        <Stack.Screen name="verification" options={{ title: 'ID Check' }} />
      </Stack>
    </>
  );
}
