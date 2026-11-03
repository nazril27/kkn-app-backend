export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function toErrorResponse(
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = 400
): { status: number; body: { success: false; message: string } } {
  if (error instanceof AppError) {
    return {
      status: error.status,
      body: { success: false, message: error.message },
    };
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return {
    status: fallbackStatus,
    body: { success: false, message: message || fallbackMessage },
  };
}
