import { Server } from "socket.io";
import express from "express";
import { addCoupSocketInitEvent } from "./coup.io";
import { addRoomSocketInitEvent } from "./room.io";
import { sessionMiddleware } from "../middleware";
import { env } from "../env";
import { onlineCount } from "../utils/user";

// counter for socketIO connection
export let io: Server;
// displaying system message with this name
export const botName = env.BOT_NAME;

export function initSocketServer(httpServer: any) {
  io = new Server(httpServer);

  // io middleware, merge express req into io
  io.use((socket, next) => {
    let req = socket.request as express.Request;
    let res = req.res as express.Response;
    sessionMiddleware(req, res, next as express.NextFunction);
  });
  let count = onlineCount();
  // Alert server upon new connection & increment the counter
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;

    // Alert server upon new connection & increment the counter
    count.add();
    io.emit("online-count", count.get());

    // Runs when client disconnects
    socket.on("disconnect", () => {
      // game lobby part
      count.deduct();
      io.emit("online-count", count.get());
    });
    // console.log(req.session.user?.id);
    /* ---------------------------------- TODO ---------------------------------- */
  });
  addRoomSocketInitEvent(io);
  addCoupSocketInitEvent(io);
}
