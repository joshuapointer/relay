/**
 * BrandHeader.native.tsx — Mobile brand header component.
 *
 * Renders the Relay wordmark in Deep Tech Blue on a white background.
 * BR-24: logo lockup (icon + wordmark) in header.
 * BR-9: clean modern slightly-rounded sans-serif consistent with Poppins.
 *
 * svg-based icon is intentionally kept simple: a stylized "R" shape
 * using react-native Text as a fallback that renders correctly without
 * additional native module linking requirements.
 *
 * Tech debt (upstream): Once @relay/ui-core BrandLogo is confirmed
 * RN-compatible (requires react-native-svg peer + explicit .native exports),
 * swap this for <BrandLogo /> from ui-core.
 */
import { nativeTokens } from '@relay/design-tokens/native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface BrandHeaderProps {
  testID?: string;
}

export function BrandHeader({ testID }: BrandHeaderProps) {
  return (
    <View style={styles.container} testID={testID} accessible accessibilityRole="header">
      {/* Icon mark — stylized "R" in primary blue */}
      <View style={styles.iconMark}>
        <Text style={styles.iconText}>R</Text>
      </View>
      {/* Wordmark */}
      <Text style={styles.wordmark}>elay</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconMark: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: nativeTokens.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  iconText: {
    color: nativeTokens.color.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    // Ideally: fontFamily: 'Poppins-Bold' — set if font loaded
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '700',
    color: nativeTokens.color.primary,
    // Ideally: fontFamily: 'Poppins-Bold'
    letterSpacing: -0.3,
  },
});
