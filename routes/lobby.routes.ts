import { Router } from "express";
import path from "path";
import socketIO from "socket.io";
import { getSessionUser, hasLogin } from "../guard";
import { getString, HttpError } from "../utils/express";
import { rooms, Room, roomCapacity, createRoomAndEmitMsg } from "../lobby";
import { io } from "../socketIO/socketIOManager";

export const lobbyRoutes = Router();

lobbyRoutes.get("/user/lobby", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "lobby.html"));
});

// handling room creation request --> emit & create new room
lobbyRoutes.post("/rooms", hasLogin, createRoomAndEmitMsg);

// showing all room content
lobbyRoutes.get("/rooms", (req, res) => {
  res.json({ rooms });
});

// getting room max capacity
lobbyRoutes.get("/capacity", (req, res) => {
  res.json({ roomCapacity });
});
