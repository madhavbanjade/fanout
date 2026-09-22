import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NotificationSocketListener from "@/components/notifications/NotificationSocketListener";

export default async function Home() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
      <h1 className="text-2xl font-bold text-slate-900">Fanout delivery demo</h1>
      <p className="text-sm text-slate-600">Create a notification and watch it move from PENDING to DELIVERED.</p>
      <NotificationSocketListener />
    </main>
  );
}
