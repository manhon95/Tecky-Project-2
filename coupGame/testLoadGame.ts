import { loadCoupGame } from "./coupGameList";
import express, { Request, Response } from "express";
import http from "http";
import socket from "socket.io";

import "../middleware";

declare module "express-session" {
  interface SessionData {
    socketList: string[];
  }
}

const app = express();
const server = http.createServer(app);
const io = new socket.Server(server);

loadCoupGame("1", io);
