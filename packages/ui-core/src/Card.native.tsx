import { View, StyleSheet } from 'react-native';

import { tokens, createShadowStyle } from './tokens.js';

export interface CardProps {
  children?: React.ReactNode;
}

/**
 * Card — BR-26: white bg, radius.md, shadow.card, padding 16px.
 * Native implementation using StyleSheet.
 */
export function Card({ children }: CardProps) {
  return (
    <View style={styles.card}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.white,
    borderRadius: tokens.radius.md,
    padding: 16,
    ...createShadowStyle({
      shadowColor: 'rgba(26,26,26,0.08)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 3,
    }),
  },
});
