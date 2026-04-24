/**
 * Profile screen — account info, push notifications, sign out, delete account (AC-12).
 */
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMockAuth } from '../../components/ClerkMock';
import { PROFILE } from '../../constants/strings';
import { useSdk } from '../../lib/sdk';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useMockAuth();
  const sdk = useSdk();
  const [signingOut, setSigningOut] = useState(false);
  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);

  // Fetch profile for member-since date
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => sdk.profile.get(),
    staleTime: 300_000,
  });

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      router.replace('/(auth)/sign-in' as never);
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      PROFILE.deleteConfirmTitle,
      PROFILE.deleteConfirmBody,
      [
        { text: PROFILE.deleteCancel, style: 'cancel' },
        {
          text: PROFILE.deleteConfirmAction,
          style: 'destructive',
          onPress: async () => {
            try {
              await sdk.profile.delete();
            } catch {
              // Proceed to sign out even if API call fails
            }
            await signOut();
            router.replace('/' as never);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>{PROFILE.title}</Text>

        {/* Account info card */}
        <View style={[styles.card, shadowStyle]}>
          <Text style={styles.cardLabel}>{PROFILE.emailLabel}</Text>
          <Text style={styles.cardValue} selectable>
            {user?.emailAddresses[0]?.emailAddress ?? profile?.email ?? '—'}
          </Text>

          {memberSince != null && (
            <>
              <View style={styles.divider} />
              <Text style={styles.cardLabel}>{PROFILE.memberSinceLabel}</Text>
              <Text style={styles.cardValue}>{memberSince}</Text>
            </>
          )}
        </View>

        {/* Notifications */}
        <Pressable
          style={({ pressed }) => [styles.rowButton, pressed && styles.pressed]}
          onPress={() => router.push('/(app)/notifications' as never)}
          accessibilityRole="button"
          accessibilityLabel={PROFILE.notificationsLabel}
          testID="notifications-button"
        >
          <Text style={styles.rowButtonText}>{PROFILE.notificationsLabel}</Text>
          <Text style={styles.rowButtonChevron}>›</Text>
        </Pressable>

        {/* Sign out */}
        <Pressable
          style={({ pressed }) => [
            styles.outlineButton,
            pressed && styles.pressed,
          ]}
          onPress={() => void handleSignOut()}
          disabled={signingOut}
          testID="sign-out-button"
          accessibilityRole="button"
          accessibilityLabel={signingOut ? PROFILE.signingOut : PROFILE.signOut}
        >
          <Text style={styles.outlineButtonText}>
            {signingOut ? PROFILE.signingOut : PROFILE.signOut}
          </Text>
        </Pressable>

        {/* Delete account — AC-12 */}
        <Pressable
          style={({ pressed }) => [
            styles.destructiveButton,
            pressed && styles.pressed,
          ]}
          onPress={handleDeleteAccount}
          testID="delete-account-button"
          accessibilityRole="button"
          accessibilityLabel={PROFILE.deleteAccount}
        >
          <Text style={styles.destructiveButtonText}>{PROFILE.deleteAccount}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: nativeTokens.color.surface },
  container: { padding: 24 },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: nativeTokens.color.ink,
    marginBottom: 24,
  },
  card: {
    backgroundColor: nativeTokens.color.surface,
    borderRadius: nativeTokens.radius.md,
    padding: 16,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: nativeTokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    color: nativeTokens.color.ink,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: nativeTokens.color.border,
    marginVertical: 12,
  },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: nativeTokens.color.surface,
    borderRadius: nativeTokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: nativeTokens.color.border,
    minHeight: 52,
  },
  rowButtonText: {
    flex: 1,
    fontSize: 16,
    color: nativeTokens.color.ink,
  },
  rowButtonChevron: {
    fontSize: 20,
    color: nativeTokens.color.textMuted,
  },
  outlineButton: {
    borderWidth: 1.5,
    borderColor: nativeTokens.color.primary,
    borderRadius: nativeTokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 52,
  },
  outlineButtonText: {
    color: nativeTokens.color.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButton: {
    borderWidth: 1.5,
    borderColor: nativeTokens.color.exception,
    borderRadius: nativeTokens.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 52,
  },
  destructiveButtonText: {
    color: nativeTokens.color.exception,
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: { opacity: 0.75 },
});
