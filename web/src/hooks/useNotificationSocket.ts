import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:8080";

export type NotificationEvent = {
  id: string;
  message?: string;
  payload?: { message?: string };
  status?: string;
};

export function useNotificationSocket(
  onNotification?: (notification: NotificationEvent) => void,
  enabled = true,
) {
  const queryClient = useQueryClient();
  const onNotificationRef = useRef(onNotification);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  });

  useEffect(() => {
    if (!enabled) return;

    // Sends the JWT cookie in the handshake — this is what the gateway's
    // handleConnection reads on the backend to know which room to join.
    const socket = io(SOCKET_URL, { withCredentials: true });

    socket.on("connect", () => console.log("socket connected"));

    socket.on("notification:new", (notification: NotificationEvent) => {
      onNotificationRef.current?.(notification);
      // A notification landing for this user means stats/recent/volume and
      // the inbox/unread badge are all stale right now — refetch instead of
      // waiting for the next poll tick.
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, enabled]);
}
