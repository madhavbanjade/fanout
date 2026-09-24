import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

// Server Components run outside the browser, so `credentials: "include"` has
// nothing to attach to — the incoming request's cookies have to be forwarded
// by hand for the API's cookie-based auth to see the session.
export async function serverFetch<T>(endPoint: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  try {
    const response = await fetch(`${API_BASE}/${endPoint}`, {
      headers: cookieHeader ? { Cookie: cookieHeader } : {},
      cache: "no-store",
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
