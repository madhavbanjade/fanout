import { useEffect } from "react";
//run this side effect once, and only re-run it when these specific things change
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";

type NotificationEvent = {
  id: string;
  message?: string;
  payload?: { message?: string };
  status?: string;
};

export function useNotificationSocket() {
  const queryClient = useQueryClient();
  useEffect(() => {
    //Opens the actual WebSocket connection, sending the JWT in the handshake — this is what your gateway's handleConnection reads on the backend
    const socket = io("http://localhost:3333", { withCredentials: true });
    //	Fires once the connection is actually established
    socket.on("connect", () => console.log("socket connected"));
    //	The actual live-update listener
    socket.on("notification:new", (notif: NotificationEvent) => {
      console.log("LIVE NOTIFICATION RECEIVED:", notif);
        //Manually injects the new notification into React Query's cache, without waiting for a fetch
      queryClient.setQueryData<NotificationEvent[]>(["notifications"], (old = []) => {
        const existingIndex = old.findIndex((notification) => notification.id === notif.id);

        if (existingIndex === -1) return [notif, ...old];

        return old.map((notification) =>
          notification.id === notif.id ? { ...notification, ...notif } : notification,
        );
      });
    });
    return () => {
        //	Cleanup function
      socket.disconnect();
    };
    //Re-runs this whole effect if token ever changes (e.g. user logs out, then a different user logs in)
  }, [queryClient]);
}
