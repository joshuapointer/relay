import { Pressable, Text, StyleSheet, ActivityIndicator, type ViewStyle } from 'react-native';

import { tokens } from './tokens.js';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  /** Native: onPress */
  onPress?: () => void;
  /** Web: onClick (alias for native compatibility) */
  onClick?: () => void;
  children?: React.ReactNode;
}

const variantBg: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: tokens.color.primary,
  secondary: tokens.color.white,
  ghost: 'transparent',
  danger: '#dc2626',
};

const variantText: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: tokens.color.white,
  secondary: tokens.color.primary,
  ghost: tokens.color.primary,
  danger: tokens.color.white,
};

const sizePadding: Record<NonNullable<ButtonProps['size']>, ViewStyle> = {
  sm: { paddingHorizontal: 12, paddingVertical: 6, minHeight: 32 },
  md: { paddingHorizontal: 16, paddingVertical: 8, minHeight: 44 },
  lg: { paddingHorizontal: 24, paddingVertical: 12, minHeight: 52 },
};

const sizeFontSize: Record<NonNullable<ButtonProps['size']>, number> = {
  sm: 14,
  md: 16,
  lg: 18,
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  onPress,
  onClick,
  children,
}: ButtonProps) {
  const handlePress = onPress ?? onClick;

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        sizePadding[size],
        { backgroundColor: variantBg[variant] },
        variant === 'secondary' && styles.secondaryBorder,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantText[variant]} />
      ) : (
        <Text
          style={[
            styles.label,
            { color: variantText[variant], fontSize: sizeFontSize[size] },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: tokens.color.primary,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontWeight: '500',
  },
});
