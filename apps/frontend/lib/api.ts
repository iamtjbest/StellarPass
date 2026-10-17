// Base URL of the StellarPass backend, e.g. http://localhost:3001
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/+$/, '');

/**
 * fetch() against the configured backend. Rejects with a descriptive error
 * when NEXT_PUBLIC_BACKEND_URL is not set, so callers' existing error
 * handling surfaces the misconfiguration instead of requesting a wrong host.
 */
export function fetchBackend(path: string, init?: Parameters<typeof fetch>[1]): Promise<Response> {
  if (!BACKEND_URL) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_BACKEND_URL is not set. Configure it to point at the StellarPass backend.'),
    );
  }

  return fetch(`${BACKEND_URL}${path}`, init);
}
