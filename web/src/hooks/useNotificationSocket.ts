import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { SOCKET_URLS } from "../utils/apiHosts";

export const SOCKET_URL = SOCKET_URLS[0];

export type NotificationEvent = {
  id: string;
  message?: string;
  payload?: { message?: string };
  status?: string;
};

// When the API is on another domain the login cookie never reaches it, so the
// token is fetched from this app's own server and sent in the handshake.
async function fetchSocketToken(): Promise<string | undefined> {
  try {
    const response = await fetch("/api/socket-token", { cache: "no-store" });
    if (!response.ok) return undefined;
    const { token } = (await response.json()) as { token?: string | null };
    return token ?? undefined;
  } catch {
    return undefined;
  }
}

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

    let cancelled = false;
    let socket: Socket | null = null;

    const attach = (s: Socket) => {
      s.on("connect", () => console.log("socket connected"));

      s.on("notification:new", (notification: NotificationEvent) => {
        onNotificationRef.current?.(notification);
        // A notification landing for this user means stats/recent/volume and
        // the inbox/unread badge are all stale right now — refetch instead of
        // waiting for the next poll tick.
        void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      });
    };

    // Sends the JWT cookie in the handshake — this is what the gateway's
    // handleConnection reads on the backend to know which room to join.
    // Tries each configured instance in turn; if the one we're connected to
    // is killed (e.g. mid-demo), we hop to the next instead of staying dark.
    const connect = (urlIndex: number) => {
      if (cancelled) return;
      const s = io(SOCKET_URLS[urlIndex], {
        withCredentials: true,
        reconnectionAttempts: 3,
        // Re-fetched on every (re)connect so it never goes stale.
        auth: (callback) => {
          void fetchSocketToken().then((token) => callback(token ? { token } : {}));
        },
      });
      socket = s;
      attach(s);

      s.on("connect_error", () => {
        const nextIndex = urlIndex + 1;
        if (nextIndex < SOCKET_URLS.length) {
          s.disconnect();
          connect(nextIndex);
        }
      });
    };

    connect(0);

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [queryClient, enabled]);
}
