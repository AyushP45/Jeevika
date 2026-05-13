import { io } from "socket.io-client";
import { useJeevikaStore } from "./store.js";
import { toast } from "sonner";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let socket = null;

export const initSocket = (userId) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true
  });

  socket.on("connect", () => {
    console.log("Connected to Real-time Server:", socket.id);
    socket.emit("join", userId);
  });

  socket.on("notification", (notif) => {
    console.log("Live Notification:", notif);
    
    // Update local store
    const { setNotifications } = useJeevikaStore.getState();
    setNotifications(prev => [notif, ...prev]);

    // Show toast
    toast.info(notif.title, {
      description: notif.message,
      duration: 5000,
      action: notif.actionUrl ? {
        label: "View",
        onClick: () => window.location.href = notif.actionUrl
      } : null
    });
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from Real-time Server");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
