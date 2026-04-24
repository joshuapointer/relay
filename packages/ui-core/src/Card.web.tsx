import clsx from 'clsx';

export interface CardProps {
  children?: React.ReactNode;
  className?: string;
}

/**
 * Card — BR-26: white bg, radius.md (8px), shadow.card, padding 16px.
 * Web implementation using Tailwind classes.
 */
export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white rounded-lg p-4',
        'shadow-[0_2px_8px_0_rgba(26,26,26,0.08)]',
        className,
      )}
    >
      {children}
    </div>
  );
}
