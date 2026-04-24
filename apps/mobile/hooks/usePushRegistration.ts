/**
 * usePushRegistration — retrieves an Expo push token and posts it to
 * POST /v1/push-tokens once per mount when the user is signed in.
 *
 * Guards:
 *  - Skips on Platform.OS === 'web' (expo-notifications is not supported).
 *  - Skips when no projectId is configured (Expo Go / preview builds).
 *  - Best-effort; failures are swallowed so app UI stays unaffected.
 */
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useMockAuth } from '../components/ClerkMock';
import { useSdk } from '../lib/sdk';

export function usePushRegistration(): void {
  const sdk = useSdk();
  const { isSignedIn, isLoaded } = useMockAuth();
  const didRegister = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (Platform.OS === 'web') return;
    if (didRegister.current) return;

    const projectId =
      (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)
        ?.projectId ??
      (Constants.easConfig as { projectId?: string } | undefined)?.projectId;
    if (projectId == null || projectId === '') return;

    didRegister.current = true;
    void (async () => {
      try {
        const perm = await Notifications.getPermissionsAsync();
        let status = perm.status;
        if (status !== 'granted') {
          const req = await Notifications.requestPermissionsAsync();
          status = req.status;
        }
        if (status !== 'granted') return;

        const tokenResp = await Notifications.getExpoPushTokenAsync({ projectId });
        const platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android';
        await sdk.pushTokens.register({ token: tokenResp.data, platform });
      } catch {
        // best-effort; ignore failures (missing perm, transient network, etc.)
      }
    })();
  }, [isLoaded, isSignedIn, sdk]);
}
