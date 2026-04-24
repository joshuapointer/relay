export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * ErrorState — shown when a data fetch fails.
 * a11y: role=alert (assertive by default) so screen readers announce the error.
 */
export function ErrorState({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-exception/30 bg-surface p-10 text-center shadow-card"
    >
      {/* Warning icon */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-exception/10" aria-hidden="true">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-exception"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>

      <p className="font-body mb-5 text-sm text-ink">{message}</p>

      {onRetry != null && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md bg-primary px-5 py-2.5 font-body text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
        >
          Try again
        </button>
      )}
    </div>
  );
}
