import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverFetch } from "@/src/utils/serverApi";
import DashboardView from "@/src/components/dashboard/dashboard-view";
import type { AuthUser, DashboardStats, PaginatedRecent, VolumePoint } from "@/src/types";

export default async function Home() {
  const cookieStore = await cookies();

  if (!cookieStore.has("accessToken")) {
    redirect("/auth");
  }

  const [user, stats, volume, recent] = await Promise.all([
    serverFetch<AuthUser>("auth/me"),
    serverFetch<DashboardStats>("notifications/stats"),
    serverFetch<VolumePoint[]>("notifications/volume?days=7"),
    serverFetch<PaginatedRecent>("notifications/recent?page=1&pageSize=10"),
  ]);

  if (!user) {
    redirect("/auth");
  }

  return (
    <DashboardView
      user={user}
      initialStats={
        stats ?? {
          sentToday: { value: 0, deltaPct: 0 },
          delivered: { value: 0, deltaPct: 0 },
          failed: { value: 0, deltaPct: 0 },
          avgLatencyMs: { value: 0, deltaMs: 0 },
        }
      }
      initialVolume={volume ?? []}
      initialRecent={recent ?? { items: [], total: 0, page: 1, pageSize: 10 }}
    />
  );
}
