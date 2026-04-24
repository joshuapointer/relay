import clsx from 'clsx';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  /** Web: onClick */
  onClick?: () => void;
  /** Native: onPress (alias for web compatibility) */
  onPress?: () => void;
  children?: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-[#003B73] text-white hover:bg-[#002d5a] active:bg-[#002350] focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2',
  secondary:
    'bg-white text-[#003B73] border border-[#003B73] hover:bg-[#f0f4f8] active:bg-[#e0e8f0] focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2',
  ghost:
    'bg-transparent text-[#003B73] hover:bg-[#f0f4f8] active:bg-[#e0e8f0] focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2',
  danger:
    'bg-[#dc2626] text-white hover:bg-[#b91c1c] active:bg-[#991b1b] focus-visible:ring-2 focus-visible:ring-[#FFB800] focus-visible:ring-offset-2',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md min-h-[32px]',
  md: 'px-4 py-2 text-base rounded-md min-h-[40px]',
  lg: 'px-6 py-3 text-lg rounded-lg min-h-[48px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  onClick,
  onPress,
  children,
}: ButtonProps) {
  const handleClick = onClick ?? onPress;

  return (
    <button
      type="button"
      aria-label={accessibilityLabel}
      disabled={disabled || loading}
      onClick={handleClick}
      className={clsx(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 outline-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        (disabled || loading) && 'opacity-50 cursor-not-allowed pointer-events-none',
      )}
    >
      {loading ? <span aria-hidden="true">…</span> : children}
    </button>
  );
}
