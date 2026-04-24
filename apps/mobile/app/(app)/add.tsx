/**
 * Add-tracking modal screen.
 * WS-C-03: submits to API via @relay/sdk, navigates on success.
 */
import { nativeTokens } from '@relay/design-tokens/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADD } from '../../constants/strings';
import { useSdk } from '../../lib/sdk';

// ---------------------------------------------------------------------------
// Carrier options
// ---------------------------------------------------------------------------

const CARRIERS = [
  { code: '', label: ADD.carrierPlaceholder },
  { code: 'USPS', label: 'USPS' },
  { code: 'UPS', label: 'UPS' },
  { code: 'FEDEX', label: 'FedEx' },
  { code: 'DHL', label: 'DHL' },
] as const;

type CarrierCode = '' | 'USPS' | 'UPS' | 'FEDEX' | 'DHL';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AddScreen() {
  const router = useRouter();
  const sdk = useSdk();

  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrierCode, setCarrierCode] = useState<CarrierCode>('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = trackingNumber.trim().length > 0;

  const handleAdd = async () => {
    if (!isValid || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const shipment = await sdk.shipments.create({
        trackingNumber: trackingNumber.trim(),
        carrierCode: carrierCode || undefined,
        nickname: nickname.trim() || undefined,
      });
      router.replace(`/(app)/shipments/${shipment.id}` as never);
    } catch {
      setError(ADD.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.cancelButton}
            accessibilityRole="button"
            accessibilityLabel={ADD.cancel}
          >
            <Text style={styles.cancelText}>{ADD.cancel}</Text>
          </Pressable>
          <Text style={styles.title}>{ADD.title}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Tracking number */}
          <Text style={styles.label}>{ADD.trackingNumberLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={ADD.trackingNumberPlaceholder}
            placeholderTextColor={nativeTokens.color.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
            testID="add-tracking-number"
            accessibilityLabel={ADD.trackingNumberLabel}
          />

          {/* Carrier picker — simple segmented control for MVP */}
          <Text style={styles.label}>{ADD.carrierLabel}</Text>
          <View style={styles.carrierRow}>
            {CARRIERS.filter((c) => c.code !== '').map((c) => (
              <Pressable
                key={c.code}
                onPress={() =>
                  setCarrierCode(
                    (prev) => (prev === c.code ? '' : c.code) as CarrierCode,
                  )
                }
                style={[
                  styles.carrierChip,
                  carrierCode === c.code && styles.carrierChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={c.label}
                accessibilityState={{ selected: carrierCode === c.code }}
                testID={`carrier-${c.code}`}
              >
                <Text
                  style={[
                    styles.carrierChipText,
                    carrierCode === c.code && styles.carrierChipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.hint}>{ADD.carrierHint}</Text>

          {/* Nickname */}
          <Text style={styles.label}>{ADD.nicknameLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={ADD.nicknamePlaceholder}
            placeholderTextColor={nativeTokens.color.textMuted}
            value={nickname}
            onChangeText={setNickname}
            testID="add-nickname"
            accessibilityLabel={ADD.nicknameLabel}
          />

          {/* Error */}
          {error != null && <Text style={styles.errorText}>{error}</Text>}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              (!isValid || submitting) && styles.disabled,
              pressed && isValid && !submitting && styles.pressed,
            ]}
            onPress={() => void handleAdd()}
            disabled={!isValid || submitting}
            testID="add-submit"
            accessibilityRole="button"
            accessibilityLabel={submitting ? ADD.submitting : ADD.submitCta}
            accessibilityState={{ disabled: !isValid || submitting }}
          >
            <Text style={styles.primaryButtonText}>
              {submitting ? ADD.submitting : ADD.submitCta}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: nativeTokens.color.surface },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: nativeTokens.color.border,
  },
  cancelButton: { flex: 1 },
  cancelText: {
    color: nativeTokens.color.primary,
    fontSize: 16,
  },
  title: {
    flex: 2,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: nativeTokens.color.ink,
  },
  headerRight: { flex: 1 },
  container: { padding: 24 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: nativeTokens.color.ink,
    marginBottom: 6,
    marginTop: 16,
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
    minHeight: 44,
  },
  carrierRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  carrierChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: nativeTokens.radius.pill,
    borderWidth: 1,
    borderColor: nativeTokens.color.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  carrierChipActive: {
    backgroundColor: nativeTokens.color.primary,
    borderColor: nativeTokens.color.primary,
  },
  carrierChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: nativeTokens.color.ink,
  },
  carrierChipTextActive: {
    color: nativeTokens.color.white,
  },
  hint: {
    fontSize: 13,
    color: nativeTokens.color.textMuted,
    marginTop: 6,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: nativeTokens.color.exception,
    marginTop: 12,
    marginBottom: 4,
  },
  primaryButton: {
    backgroundColor: nativeTokens.color.primary,
    borderRadius: nativeTokens.radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 28,
    minHeight: 52,
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  primaryButtonText: {
    color: nativeTokens.color.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
