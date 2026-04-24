import type { ReactNode } from 'react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

/**
 * EmptyState — shown when a list has no items.
 * a11y: role=status, aria-live=polite so screen readers are informed.
 */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center rounded-lg bg-neutral p-10 text-center shadow-card"
    >
      {/* Simple package icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-border/30" aria-hidden="true">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-textMuted"
        >
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      </div>

      <p className="font-heading mb-1 text-lg font-semibold text-ink">{title}</p>

      {description != null && (
        <p className="font-body mb-5 max-w-xs text-sm text-textMuted">{description}</p>
      )}

      {action != null && action}
    </div>
  );
}
