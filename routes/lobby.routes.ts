import { Router } from "express";
import path from "path";
import socketIO from "socket.io";
import { getSessionUser, hasLogin, isLoggedIn } from "../guard";
import { getString, HttpError } from "../utils/express";
import { rooms, Room, roomCapacity } from "../lobby";
import { io } from "../socketIO/socketIOManager";

export const lobbyRoutes = Router();

let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0);

lobbyRoutes.get("/user/lobby", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "lobby.html"));
});

// handling room creation request --> emit & create new room
lobbyRoutes.post("/rooms", hasLogin, (req, res) => {
  let roomName = getString(req, "name");
  const sessionUser = getSessionUser(req);
  if (sessionUser) {
    let owner = sessionUser.username;
    if (rooms.find((room) => room.owner === owner) !== undefined) {
      throw new HttpError(400, "You already own a room");
    }
    if (rooms.find((room) => room.name === roomName)) {
      throw new HttpError(
        400,
        "Room name existed, please try another room name"
      );
    }
    let room: Room = { id: maxRoomId, name: roomName, owner, count: 0 };
    rooms.push(room);
    res.json({ maxRoomId });
    maxRoomId++;
    io.emit("new-room", room);
  }
});

// showing all room content
lobbyRoutes.get("/rooms", (req, res) => {
  res.json({ rooms });
});

// getting room max capacity
lobbyRoutes.get("/capacity", (req, res) => {
  res.json({ roomCapacity });
});
