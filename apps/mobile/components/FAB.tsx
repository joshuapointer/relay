/**
 * FAB — Floating Action Button primitive
 * Consumes design tokens; default primary color Deep Tech Blue #003B73.
 */
import { nativeTokens, createShadowStyle } from '@relay/design-tokens/native';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface FABProps {
  /** Icon label — defaults to "+" */
  icon?: string;
  onPress?: () => void;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function FAB({
  icon = '+',
  onPress,
  backgroundColor = nativeTokens.color.primary,
  style,
  testID,
}: FABProps) {
  const shadowStyle = createShadowStyle(nativeTokens.shadow.card);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        { backgroundColor },
        shadowStyle,
        pressed && styles.pressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={icon === '+' ? 'Add shipment' : icon}
    >
      <Text style={styles.icon}>{icon}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: 56,
    height: 56,
    borderRadius: nativeTokens.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: nativeTokens.color.white,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '400',
  },
  pressed: {
    opacity: 0.85,
  },
});
