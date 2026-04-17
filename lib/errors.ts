export function toErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return fallback;
}
