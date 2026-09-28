import { cookies } from "next/headers";

// The socket connects straight to the API, which can't see this site's
// login cookie when the two live on different domains. This hands the
// logged-in user's token to the socket client so it can send it explicitly.
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return Response.json({ token: null }, { status: 401 });
  }

  return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
