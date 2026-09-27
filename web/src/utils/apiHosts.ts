// Two API instances can run side by side for demos (see api/.env and
// api/.env.instance2, on ports 3338 and 3002). Killing whichever one the
// frontend is pinned to used to just break fetches — these lists let callers
// fail over to the other instance instead of hardcoding a single URL.
export const API_BASES = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_API_URL_FALLBACK,
].filter((url): url is string => Boolean(url));

if (API_BASES.length === 0) API_BASES.push("http://localhost:8080/api/v1");

export const SOCKET_URLS = [
  process.env.NEXT_PUBLIC_SOCKET_URL,
  process.env.NEXT_PUBLIC_SOCKET_URL_FALLBACK,
].filter((url): url is string => Boolean(url));

if (SOCKET_URLS.length === 0) SOCKET_URLS.push("http://localhost:8080");

// fetch() rejects with a TypeError (e.g. "Failed to fetch" / "fetch failed")
// when the connection itself fails — refused, reset, DNS, offline. A non-2xx
// HTTP response resolves normally and isn't a network error, so it never
// triggers failover.
export const isNetworkError = (error: unknown): boolean => error instanceof TypeError;
