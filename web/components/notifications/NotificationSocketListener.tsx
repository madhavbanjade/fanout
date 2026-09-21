"use client";

import { useNotificationSocket } from "@/hooks/useNotificationSocket";

export default function NotificationSocketListener() {
  useNotificationSocket();
  return null;
}
