"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import { capitalize, formatDeltaMs, formatDeltaPct, greetingForHour, timeAgo } from "@/src/utils/format";
import type { AuthUser, DashboardStats, PaginatedRecent, VolumePoint } from "@/src/types";
import StatCard from "./stat-card";
import StatusBadge from "./status-badge";
import VolumeChart from "./volume-chart";
import { BoltIcon, CheckIcon, TrendUpIcon, XIcon } from "./icons";

const RECENT_PAGE_SIZE = 10;

interface Props {
  user: AuthUser;
  initialStats: DashboardStats;
  initialVolume: VolumePoint[];
  initialRecent: PaginatedRecent;
}

async function requireData<T>(endPoint: string): Promise<T> {
  const response = await fetchAPI<T>({ endPoint });
  if (!response.success) throw new Error(response.error);
  return response.data;
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5" style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export default function DashboardView({ user, initialStats, initialVolume, initialRecent }: Props) {
  const queryClient = useQueryClient();
  const [isSendingDemo, setIsSendingDemo] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: () => requireData<DashboardStats>("notifications/stats"),
    initialData: initialStats,
    refetchInterval: 5000,
  });

  const { data: volume } = useQuery({
    queryKey: ["dashboard", "volume"],
    queryFn: () => requireData<VolumePoint[]>("notifications/volume?days=7"),
    initialData: initialVolume,
    refetchInterval: 15000,
  });

  const [recentPage, setRecentPage] = useState(1);

  const { data: recent } = useQuery({
    queryKey: ["dashboard", "recent", recentPage],
    queryFn: () => requireData<PaginatedRecent>(`notifications/recent?page=${recentPage}&pageSize=${RECENT_PAGE_SIZE}`),
    initialData: initialRecent,
    refetchInterval: 5000,
  });

  const totalPages = Math.max(1, Math.ceil(recent.total / recent.pageSize));

  const today = new Date();
  const dateLabel = today
    .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
  const firstName = user.name.split(" ")[0];

  const sentDelta = formatDeltaPct(stats.sentToday.deltaPct);
  const deliveredDelta = formatDeltaPct(stats.delivered.deltaPct);
  const failedDelta = formatDeltaPct(stats.failed.deltaPct, true);
  const latencyDelta = formatDeltaMs(stats.avgLatencyMs.deltaMs);

  async function sendDemoNotification() {
    setIsSendingDemo(true);
    await fetchAPI({
      endPoint: "notifications",
      method: "POST",
      data: { type: "demo", payload: { message: "Your queued notification is being delivered." } },
    });
    await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    setIsSendingDemo(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="overline-label">{dateLabel}</p>
          <h1
            className="mt-1"
            style={{ fontSize: "var(--text-2xl)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}
          >
            Good {greetingForHour(today)}, {firstName}.
          </h1>
        </div>
        <button type="button" className="btn-outline" onClick={sendDemoNotification} disabled={isSendingDemo}>
          {isSendingDemo ? "Sending…" : "Send test notification"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sent today"
          value={stats.sentToday.value.toLocaleString()}
          deltaLabel={sentDelta.text}
          deltaPositive={sentDelta.positive}
          accent="var(--color-primary)"
          iconBg="var(--color-primary-18)"
          iconColor="var(--color-primary)"
          icon={<TrendUpIcon />}
        />
        <StatCard
          label="Delivered"
          value={stats.delivered.value.toLocaleString()}
          deltaLabel={deliveredDelta.text}
          deltaPositive={deliveredDelta.positive}
          accent="var(--color-success)"
          iconBg="var(--color-success-bg)"
          iconColor="var(--color-success)"
          icon={<CheckIcon />}
        />
        <StatCard
          label="Failed"
          value={stats.failed.value.toLocaleString()}
          deltaLabel={failedDelta.text}
          deltaPositive={failedDelta.positive}
          accent="var(--color-danger)"
          iconBg="var(--color-danger-bg)"
          iconColor="var(--color-danger)"
          icon={<XIcon />}
        />
        <StatCard
          label="Avg latency"
          value={`${stats.avgLatencyMs.value}ms`}
          deltaLabel={latencyDelta.text}
          deltaPositive={latencyDelta.positive}
          accent="var(--color-warning)"
          iconBg="var(--color-warning-bg)"
          iconColor="var(--color-warning)"
          icon={<BoltIcon />}
        />
      </div>

      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
              Delivery volume
            </h2>
            <p className="text-muted">Last 7 days</p>
          </div>
          <div className="flex items-center gap-4">
            <Legend color="var(--color-primary)" label="Sent" />
            <Legend color="var(--color-success)" label="Delivered" />
          </div>
        </div>
        <div className="mt-4">
          <VolumeChart data={volume} />
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
            Recent deliveries
          </h2>
          <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>
            {recent.total} total
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
                {["From / To", "Message", "Type", "Channel", "Status", "Time"].map((heading) => (
                  <th key={heading} className="section-label px-5 py-2 text-left font-normal">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-muted px-5 py-6 text-center">
                    No notifications yet — send a test notification to see it flow through.
                  </td>
                </tr>
              )}
              {recent.items.map((item) => {
                const from = item.direction === "sent" ? "You" : item.sender;
                const to = item.direction === "received" ? "You" : item.recipient;
                return (
                <tr key={item.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td className="px-5 py-3" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                    {from === to ? from : `${from} → ${to}`}
                  </td>
                  <td className="max-w-55 truncate px-5 py-3 text-muted" style={{ fontSize: "var(--text-sm)" }}>
                    {item.message || "—"}
                  </td>
                  <td
                    className="px-5 py-3"
                    style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--color-text-primary)" }}
                  >
                    {capitalize(item.type)}
                  </td>
                  <td className="text-muted px-5 py-3">{item.channel}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="mono-data px-5 py-3">{timeAgo(item.createdAt)}</td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div
            className="flex items-center justify-between px-5 py-3"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <span className="text-muted" style={{ fontSize: "var(--text-xs)" }}>
              Page {recentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "0.375rem 0.875rem", fontSize: "var(--text-xs)" }}
                onClick={() => setRecentPage((page) => Math.max(1, page - 1))}
                disabled={recentPage === 1}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn-outline"
                style={{ padding: "0.375rem 0.875rem", fontSize: "var(--text-xs)" }}
                onClick={() => setRecentPage((page) => Math.min(totalPages, page + 1))}
                disabled={recentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
