import { Server } from "socket.io";

import express from "express";

import { sessionMiddleware } from "../middleware";

import { addPageSocketInitEvent } from "./page.io";

export let io: Server;

export function initSocketServer(httpServer: any) {
  io = new Server(httpServer);

  io.use((socket, next) => {
    let req = socket.request as express.Request;
    let res = req.res as express.Response;
    sessionMiddleware(req, res, next as express.NextFunction);
  });

  io.on("connection", (socket) => {
    const req = socket.request as express.Request;

    //Put event here if event need to be check across all page with socketio init in page.js
  });
  /* -------------------------------- important ------------------------------- */
  addPageSocketInitEvent(io); //add you page Socket Init event here
  /* -------------------------------- important ------------------------------- */
}
