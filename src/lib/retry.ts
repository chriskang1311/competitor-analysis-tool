/**
 * Wraps an async function with retry logic using exponential backoff.
 * Attempts: 1s → 2s → 4s delay between retries.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = "operation"
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delaySecs = Math.pow(2, attempt - 1); // 1s, 2s, 4s
      console.warn(
        `⚠️  [${label}] failed (attempt ${attempt}/${maxAttempts}) — retrying in ${delaySecs}s…`
      );
      await new Promise(r => setTimeout(r, delaySecs * 1000));
    }
  }
  // Unreachable — TypeScript needs this
  throw new Error(`${label} failed after ${maxAttempts} attempts`);
}
