import { Router } from "express";
import path from "path";
import socketIO from "socket.io";
import { hasLogin, isLoggedIn } from "../guard";

export const lobbyRoutes = Router();

lobbyRoutes.get("/user/lobby", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "lobby.html"));
});
