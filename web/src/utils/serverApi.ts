import { cookies } from "next/headers";
import { API_BASES, isNetworkError } from "./apiHosts";

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
