"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { fetchAPI } from "@/src/utils/apiservice";

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
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: async () => [],
    initialData: [],
  });

  useEffect(() => {
    const pendingNotifications = notifications.filter(
      (notification) => notification.status === "PENDING",
    );
    if (pendingNotifications.length === 0) return;

    async function refreshPendingStatuses() {
      const results = await Promise.all(
        pendingNotifications.map((notification) =>
          fetchAPI<Notification>({
            endPoint: "notifications",
            id: notification.id,
          }),
        ),
      );

      queryClient.setQueryData<Notification[]>(["notifications"], (old = []) =>
        old.map((notification) => {
          const updated = results.find(
            (result) => result.success && result.data.id === notification.id,
          );
          return updated?.success ? updated.data : notification;
        }),
      );
    }

    void refreshPendingStatuses();
    const interval = window.setInterval(() => void refreshPendingStatuses(), 1000);
    return () => window.clearInterval(interval);
  }, [notifications, queryClient]);

  async function createDemoNotification() {
    const response = await fetchAPI<Notification, { type: string; payload: { message: string } }>({
      endPoint: "notifications",
      method: "POST",
      data: {
        type: "demo",
        payload: { message: "Your queued notification is being delivered." },
      },
    });

    if (!response.success) {
      console.error("Could not create demo notification:", response.error);
      return;
    }

    // The POST response arrives before the worker delivers the job. Put this
    // PENDING record in the cache immediately; the socket event will replace it
    // with DELIVERED once the worker has finished.
    queryClient.setQueryData<Notification[]>(["notifications"], (old = []) => [
      response.data,
      ...old.filter((notification) => notification.id !== response.data.id),
    ]);
  }

  return (
    <>
      <button
        type="button"
        onClick={createDemoNotification}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Create demo notification
      </button>

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
    </>
  );
}
