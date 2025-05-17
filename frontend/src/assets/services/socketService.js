// src/services/socketService.js
import { io } from "socket.io-client";

let socket = null;
const WS_URL = import.meta.env.VITE_WS_URL || "http://localhost:3000";

export function connectSocket() {
  if (socket) return;
  socket = io(WS_URL);      // ✔️
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}

export function onSoUpdate(cb) {
  if (!socket) return;
  socket.on("so:update", cb);
}

export function offSoUpdate(cb) {
  if (!socket) return;
  socket.off("so:update", cb);
}
