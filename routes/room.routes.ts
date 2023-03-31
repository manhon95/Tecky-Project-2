import "../middleware";
import { getString, HttpError } from "../utils/express";
import { Router } from "express";
import { getSessionUser, hasLogin } from "../guard";
import socketIO from "socket.io";
import path from "path";

export const roomRoutes = Router();

roomRoutes.get("/user/room", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "room.html"));
});
