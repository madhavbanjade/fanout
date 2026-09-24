"use client";

import type { NotificationEvent } from "@/src/hooks/useNotificationSocket";

export default function LiveToast({ toasts }: { toasts: NotificationEvent[] }) {
  if (toasts.length === 0) return null;

  return (
    <section
      aria-label="Live notifications"
      className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <article
          key={toast.id}
          className="card slide-in-right p-4"
          style={{ boxShadow: "var(--shadow-toast)" }}
        >
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
            {toast.message ?? toast.payload?.message ?? "New notification"}
          </p>
        </article>
      ))}
    </section>
  );
}
