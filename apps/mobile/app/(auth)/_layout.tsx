/**
 * Auth layout — redirects to /(app)/home if already signed in.
 */
import { Redirect, Stack } from 'expo-router';

import { useMockAuth } from '../../components/ClerkMock';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useMockAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return <Redirect href="/(app)/home" />;
  }

  return (
    <Stack>
      <Stack.Screen
        name="sign-in"
        options={{ title: 'Sign In', headerShown: false }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ title: 'Sign Up', headerShown: false }}
      />
    </Stack>
  );
}
