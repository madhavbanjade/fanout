import { cookies } from "next/headers";
import { API_BASES as CLIENT_API_BASES, isNetworkError } from "./apiHosts";

// The browser may reach the API through a same-origin proxy (a relative
// NEXT_PUBLIC_API_URL like "/api/v1"), which Server Components can't use, so
// API_URL (server-only) gives them the API's real absolute address.
const API_BASES = process.env.API_URL ? [process.env.API_URL] : CLIENT_API_BASES;

let activeBaseIndex = 0;

// Server Components run outside the browser, so `credentials: "include"` has
// nothing to attach to — the incoming request's cookies have to be forwarded
// by hand for the API's cookie-based auth to see the session.
export async function serverFetch<T>(endPoint: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  for (let attempt = 0; attempt < API_BASES.length; attempt++) {
    const baseIndex = (activeBaseIndex + attempt) % API_BASES.length;

    try {
      const response = await fetch(`${API_BASES[baseIndex]}/${endPoint}`, {
        headers: cookieHeader ? { Cookie: cookieHeader } : {},
        cache: "no-store",
      });
      activeBaseIndex = baseIndex;
      if (!response.ok) return null;
      return (await response.json()) as T;
    } catch (error) {
      if (isNetworkError(error) && attempt < API_BASES.length - 1) continue;
      return null;
    }
  }

  return null;
}
