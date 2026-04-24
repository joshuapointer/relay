import clsx from 'clsx';

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'bodyLg' | 'body' | 'caption';
export type TextFamily = 'header' | 'body';

export interface TextProps {
  variant?: TextVariant;
  family?: TextFamily;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: string;
  children?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<TextVariant, string> = {
  display: 'text-5xl font-bold leading-tight',
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-3xl font-semibold leading-snug',
  h3: 'text-2xl font-semibold leading-snug',
  bodyLg: 'text-lg font-normal leading-relaxed',
  body: 'text-base font-normal leading-relaxed',
  caption: 'text-sm font-normal leading-normal',
};

const familyClasses: Record<TextFamily, string> = {
  header: 'font-[Poppins,system-ui,sans-serif]',
  body: 'font-[Inter,system-ui,sans-serif]',
};

const weightClasses: Record<NonNullable<TextProps['weight']>, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function Text({
  variant = 'body',
  family = 'body',
  weight,
  color,
  children,
  className,
}: TextProps) {
  const Tag =
    variant === 'display' || variant === 'h1'
      ? 'h1'
      : variant === 'h2'
        ? 'h2'
        : variant === 'h3'
          ? 'h3'
          : 'span';

  return (
    <Tag
      className={clsx(
        variantClasses[variant],
        familyClasses[family],
        weight && weightClasses[weight],
        className,
      )}
      style={color ? { color } : undefined}
    >
      {children}
    </Tag>
  );
}
