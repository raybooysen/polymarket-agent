import { getVersion } from '../utils.js';

const TIMEOUT_MS = 10_000;
const RETRY_DELAY_MS = 2_000;
const RATE_LIMIT_DELAY_MS = 300;

let lastRequestTime = 0;

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_DELAY_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': `polymarket-cli/${getVersion()}`,
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiFetch<T>(url: string): Promise<T> {
  await rateLimit();

  let response = await fetchWithTimeout(url);

  // Handle 429
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const delaySeconds = retryAfter ? parseInt(retryAfter, 10) : 5;
    await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    response = await fetchWithTimeout(url);
    if (response.status === 429) {
      throw new Error(`Rate limited: ${url}`);
    }
  }

  // Retry once on 5xx
  if (response.status >= 500) {
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    response = await fetchWithTimeout(url);
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json() as Promise<T>;
}

/** Reset rate limit state (for testing) */
export function _resetRateLimit(): void {
  lastRequestTime = 0;
}
