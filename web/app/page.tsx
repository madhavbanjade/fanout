import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      Welcome to Fanout
    </main>
  );
}
