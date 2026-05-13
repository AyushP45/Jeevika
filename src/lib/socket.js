import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let socket = null;

export function connectSocket(userId) {
  if (socket) return socket;

  socket = io(SOCKET_URL);
  
  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
    socket.emit("join", userId);
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
