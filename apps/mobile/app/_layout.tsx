/**
 * Root layout — wraps app with ClerkOrMockProvider, QueryClientProvider,
 * SafeAreaProvider, and loads fonts via expo-font.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ClerkOrMockProvider } from '../components/ClerkMock';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  // Font files vendored by WS-D-03c — paths are placeholders until assets land
  useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
  });

  const publishableKey =
    process.env.CLERK_PUBLISHABLE_KEY ??
    (Constants.expoConfig?.extra?.CLERK_PUBLISHABLE_KEY as string | undefined);

  // Render even if fonts not loaded — screens will use system fonts until ready
  return (
    <ClerkOrMockProvider publishableKey={publishableKey}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ClerkOrMockProvider>
  );
}
