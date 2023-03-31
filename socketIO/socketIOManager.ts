import { Server } from "socket.io";
import { Application } from "express";
import {
  getCurrentPlayer,
  getRoomPlayers,
  playerJoin,
  playerLeave,
  togglePlayerReady,
} from "../utils/players";
import { formatMessage } from "../utils/messages";
import { rooms } from "../lobby";
import express from "express";
import { createCoupGame } from "../coupGame/coupGameList";
import { addCoupSocketFunction } from "../coupGame/coupSocketFunction";
import { sessionMiddleware } from "../middleware";
import { env } from "../env";
import { onlineCount } from "../utils/user";
import { createRoomSocketEvent } from "./room.io";

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

  // Alert server upon new connection & increment the counter
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;

    // Alert server upon new connection & increment the counter
    onlineCount().add();
    io.emit("online-count", onlineCount().get());

    // Runs when client disconnects
    socket.on("disconnect", () => {
      // game lobby part
      onlineCount().deduct();
      io.emit("online-count", onlineCount().get());
    });
    // console.log(req.session.user?.id);
    /* ---------------------------------- TODO ---------------------------------- */

    addCoupSocketFunction(io, socket, req.session);
  });
  createRoomSocketEvent(io);
}
