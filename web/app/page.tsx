import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NotificationSocketListener from "@/components/notifications/NotificationSocketListener";

export default async function Home() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <NotificationSocketListener />
      Welcome to Fanout
    </main>
  );
}
