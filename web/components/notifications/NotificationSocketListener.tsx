"use client";

import { useQuery } from "@tanstack/react-query";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";

type Notification = {
  id: string;
  message?: string;
  payload?: { message?: string };
  status?: string;
};

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    DELIVERED: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default function NotificationSocketListener() {
  useNotificationSocket();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => [],
    initialData: [],
  });

  if (notifications.length === 0) return null;

  return (
    <section
      aria-label="Notifications"
      className="fixed right-4 bottom-4 z-50 w-full max-w-sm space-y-2"
    >
      {notifications.map((notification) => {
        const status = notification.status ?? "PENDING";
        const message =
          notification.message ?? notification.payload?.message ?? "New notification";

        return (
          <article
            key={notification.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg"
          >
            <p className="min-w-0 text-sm text-slate-800">{message}</p>
            <StatusPill status={status} />
          </article>
        );
      })}
    </section>
  );
}
