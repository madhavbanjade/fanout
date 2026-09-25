import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/src/utils/serverApi";
import ProfileView from "@/src/components/profile/profile-view";
import type { UserProfile } from "@/src/types";

export default async function ProfilePage() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  const profile = await serverFetch<UserProfile>("users/me/profile");

  return <ProfileView initialProfile={profile} />;
}
