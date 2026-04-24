/**
 * Sign-up screen — email + password only (no social for MVP).
 */
import { nativeTokens } from '@relay/design-tokens/native';
import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useMockAuth } from '../../components/ClerkMock';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useMockAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUp(email, password);
      router.replace('/(app)/home');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>RELAY</Text>
        </View>

        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.subheading}>Track your shipments with Relay</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={nativeTokens.color.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          testID="sign-up-email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={nativeTokens.color.textMuted}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          value={password}
          onChangeText={setPassword}
          testID="sign-up-password"
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
          onPress={handleSignUp}
          disabled={loading}
          testID="sign-up-submit"
        >
          {loading ? (
            <ActivityIndicator color={nativeTokens.color.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Create Account</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text style={styles.link}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: nativeTokens.color.surface },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 34,
    fontWeight: '700',
    color: nativeTokens.color.primary,
    letterSpacing: 4,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: nativeTokens.color.ink,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: nativeTokens.color.textMuted,
    marginBottom: 32,
  },
  error: {
    color: nativeTokens.color.exception,
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: nativeTokens.color.border,
    borderRadius: nativeTokens.radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: nativeTokens.color.ink,
    backgroundColor: nativeTokens.color.surface,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: nativeTokens.color.primary,
    borderRadius: nativeTokens.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  pressed: { opacity: 0.85 },
  primaryButtonText: {
    color: nativeTokens.color.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: nativeTokens.color.textMuted,
    fontSize: 14,
  },
  link: {
    color: nativeTokens.color.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
