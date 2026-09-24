import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/src/utils/serverApi";
import ComposePanel from "@/src/components/compose/compose-panel";
import type { AuthUser } from "@/src/types";

export default async function NotifyPage() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  const user = await serverFetch<AuthUser>("auth/me");

  if (!user) {
    redirect("/auth");
  }

  return <ComposePanel user={user} />;
}
