"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import type { AuthUser } from "@/src/types";
import { useNotificationSocket, type NotificationEvent } from "@/src/hooks/useNotificationSocket";
import LiveToast from "@/src/components/notifications/live-toast";
import Nav from "./nav";

const TOAST_LIFETIME_MS = 4000;

export default function AppShell({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const showNav = Boolean(user) && pathname !== "/auth";
  const [toasts, setToasts] = useState<NotificationEvent[]>([]);

  const handleNotification = useCallback((notification: NotificationEvent) => {
    setToasts((current) => [notification, ...current].slice(0, 3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== notification.id));
    }, TOAST_LIFETIME_MS);
  }, []);

  useNotificationSocket(handleNotification, Boolean(user));

  return (
    <>
      {showNav && user && <Nav user={user} />}
      <div style={{ background: showNav ? "var(--color-page-bg)" : undefined, minHeight: "100vh" }}>
        {children}
      </div>
      {user && <LiveToast toasts={toasts} />}
    </>
  );
}
