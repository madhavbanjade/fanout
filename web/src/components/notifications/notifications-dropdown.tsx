"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAPI } from "@/src/utils/apiservice";
import type { InboxNotification } from "@/src/types";
import { capitalize, timeAgo } from "@/src/utils/format";
import NotificationAvatar from "./notification-avatar";

const TABS = [
  { key: "all", label: "All" },
  { key: "mention", label: "Mentions" },
  { key: "order", label: "Orders" },
  { key: "task", label: "Tasks" },
];

export default function NotificationsDropdown({ unreadCount }: { unreadCount: number }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");

  const { data: items = [] } = useQuery({
    queryKey: ["notifications", "inbox", tab],
    queryFn: async () => {
      const response = await fetchAPI<InboxNotification[]>({
        endPoint: `notifications/inbox?type=${tab}&limit=20`,
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  async function markAllRead() {
    await fetchAPI({ endPoint: "notifications/mark-all-read", method: "POST" });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  async function handleItemClick(item: InboxNotification) {
    if (item.readAt) return;
    await fetchAPI({ endPoint: `notifications/${item.id}/read`, method: "PATCH" });
    void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <div
      className="card slide-in-right absolute top-11 right-0 z-40 w-[380px] max-w-[90vw] overflow-hidden"
      style={{ boxShadow: "var(--shadow-dropdown)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <span
            style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}
          >
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="grid h-5 min-w-5 place-items-center rounded-full px-1 text-white"
              style={{ background: "var(--color-primary)", fontSize: "10px", fontWeight: "var(--weight-semibold)" }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <button type="button" className="text-link" style={{ fontSize: "var(--text-xs)" }} onClick={markAllRead}>
          Mark all read
        </button>
      </div>

      <div className="flex gap-1 px-3 pt-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className="rounded-t-md px-3 pb-2"
            style={{
              fontSize: "var(--text-xs)",
              fontWeight: tab === item.key ? "var(--weight-medium)" : "var(--weight-regular)",
              color: tab === item.key ? "var(--color-text-primary)" : "var(--color-text-muted)",
              borderBottom: tab === item.key ? "2px solid var(--color-primary)" : "2px solid transparent",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 && (
          <p className="text-muted px-4 py-8 text-center" style={{ fontSize: "var(--text-sm)" }}>
            Nothing here yet.
          </p>
        )}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:opacity-90"
            style={{
              borderBottom: "1px solid var(--color-border)",
              background: item.readAt ? "transparent" : "var(--color-primary-10)",
            }}
          >
            <NotificationAvatar type={item.type} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                {item.payload?.title ?? item.payload?.message ?? `New ${capitalize(item.type)} notification`}
              </p>
              <p className="mono-data mt-0.5">{timeAgo(item.createdAt)}</p>
            </div>
            {!item.readAt && (
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--color-primary)" }} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
