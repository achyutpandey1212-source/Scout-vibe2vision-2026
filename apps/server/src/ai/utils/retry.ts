export interface RetryOptions {
  retries: number;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
  factor?: number;
  shouldRetry?: (error: any) => boolean;
}

export async function retryWithBackoff<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions,
  onRetry?: (error: any, attempt: number, delayMs: number) => void,
): Promise<T> {
  const {
    retries,
    minTimeoutMs = 1000,
    maxTimeoutMs = 8000,
    factor = 2,
    shouldRetry = () => true,
  } = options;

  let attempt = 0;
  while (true) {
    try {
      return await fn(attempt);
    } catch (error) {
      attempt++;
      if (attempt > retries || !shouldRetry(error)) {
        throw error;
      }

      // Calculate delay with some jitter
      const delay = Math.min(
        minTimeoutMs * Math.pow(factor, attempt - 1) + Math.random() * 200,
        maxTimeoutMs,
      );

      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
