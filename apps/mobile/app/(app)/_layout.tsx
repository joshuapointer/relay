/**
 * Authenticated app layout — redirects to sign-in if not signed in.
 */
import { Redirect, Stack } from 'expo-router';

import { useMockAuth } from '../../components/ClerkMock';
import { usePushRegistration } from '../../hooks/usePushRegistration';

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useMockAuth();
  usePushRegistration();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ title: 'Add Shipment', presentation: 'modal' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="shipments/[id]" options={{ title: 'Shipment' }} />
    </Stack>
  );
}
