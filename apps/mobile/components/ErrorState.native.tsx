/**
 * ErrorState.native.tsx — Error state component with retry.
 */
import { nativeTokens } from '@relay/design-tokens/native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COMMON } from '../constants/strings';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  testID?: string;
}

export function ErrorState({
  message = COMMON.errorGeneric,
  onRetry,
  testID,
}: ErrorStateProps) {
  return (
    <View style={styles.container} testID={testID} accessible accessibilityRole="alert">
      <Text style={styles.message}>{message}</Text>
      {onRetry != null && (
        <Pressable
          style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel={COMMON.retry}
        >
          <Text style={styles.retryText}>{COMMON.retry}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 48,
  },
  message: {
    fontSize: 15,
    color: nativeTokens.color.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: nativeTokens.color.primary,
    borderRadius: nativeTokens.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryText: {
    color: nativeTokens.color.white,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
  },
});
