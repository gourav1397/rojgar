import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { env } from "./config/env";

export function attachRealtime(server: HttpServer) {
  const io = new Server(server, {
    cors: { origin: env.WEB_ORIGIN, credentials: true },
  });

  io.on("connection", socket => {
    socket.on("join-thread", threadId => socket.join(`thread:${threadId}`));
    socket.on("chat-message", message => {
      io.to(`thread:${message.threadId}`).emit("chat-message", message);
    });
  });

  return io;
}
