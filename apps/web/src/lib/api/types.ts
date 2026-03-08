export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type ApiResponse<T> = {
  data: T;
  error?: never;
};

export type ApiErrorResponse = {
  data?: never;
  error: string;
  details?: unknown;
};
