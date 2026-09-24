import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminGate from "@/src/components/admin/admin-gate";

export default async function AdminPage() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  return <AdminGate />;
}
