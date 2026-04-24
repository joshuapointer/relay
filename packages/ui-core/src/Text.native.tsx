import { Text as RNText, StyleSheet } from 'react-native';

import { tokens } from './tokens.js';

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'caption';
export type TextFamily = 'header' | 'body';

export interface TextProps {
  variant?: TextVariant;
  family?: TextFamily;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  children?: React.ReactNode;
}

const variantFontSize: Record<TextVariant, number> = {
  display: 48,
  h1: 36,
  h2: 30,
  h3: 24,
  bodyLg: 18,
  body: 16,
  caption: 14,
};

const variantLineHeight: Record<TextVariant, number> = {
  display: 56,
  h1: 44,
  h2: 38,
  h3: 32,
  bodyLg: 28,
  body: 24,
  caption: 20,
};

const weightMap: Record<NonNullable<TextProps['weight']>, '400' | '500' | '600' | '700'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

const defaultWeightForVariant = (variant: TextVariant): '400' | '500' | '600' | '700' => {
  if (variant === 'display' || variant === 'h1') return '700';
  if (variant === 'h2' || variant === 'h3') return '600';
  return '400';
};

export function Text({
  variant = 'body',
  family = 'body',
  weight,
  color,
  children,
}: TextProps) {
  const fontFamily = family === 'header' ? 'Poppins' : 'Inter';
  const fontWeight = weight ? weightMap[weight] : defaultWeightForVariant(variant);

  return (
    <RNText
      style={[
        styles.base,
        {
          fontSize: variantFontSize[variant],
          lineHeight: variantLineHeight[variant],
          fontFamily,
          fontWeight,
          color: color ?? tokens.color.ink,
        },
      ]}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    color: tokens.color.ink,
  },
});
