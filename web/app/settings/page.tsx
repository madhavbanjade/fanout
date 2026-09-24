import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/src/utils/serverApi";
import SettingsView from "@/src/components/settings/settings-view";
import type { NotificationPreferences } from "@/src/types";

export default async function SettingsPage() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  const preferences = await serverFetch<NotificationPreferences>("users/me/preferences");

  return <SettingsView initialPreferences={preferences} />;
}
