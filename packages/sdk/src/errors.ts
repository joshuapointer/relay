import type { ApiError } from '@relay/shared-types';

export class RelayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RelayError';
  }
}

export class RelayAuthError extends RelayError {
  readonly status = 401;

  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'RelayAuthError';
  }
}

export class RelayClientError extends RelayError {
  readonly status: number;
  readonly apiError: ApiError;

  constructor(status: number, apiError: ApiError) {
    super(apiError.message);
    this.name = 'RelayClientError';
    this.status = status;
    this.apiError = apiError;
  }
}

export class RelayNetworkError extends RelayError {
  readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'RelayNetworkError';
    this.cause = cause;
  }
}

export class RelayValidationError extends RelayError {
  readonly issues: unknown;

  constructor(message: string, issues?: unknown) {
    super(message);
    this.name = 'RelayValidationError';
    this.issues = issues;
  }
}
