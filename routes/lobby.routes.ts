import { Router } from "express";
import path from "path";
import socketIO from "socket.io";
import { getSessionUser, hasLogin, isLoggedIn } from "../guard";
import { getString, HttpError } from "../utils/express";

type Room = {
  id: number;
  name: string;
  owner: string;
  count: number;
};

export let rooms: Room[] = [];
export const roomCapacity = 4;

export function createLobbyRoutes(io: socketIO.Server) {
  const lobbyRoutes = Router();

  let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0);

  lobbyRoutes.get("/user/lobby", hasLogin, (req, res) => {
    res.sendFile(path.resolve("protected", "lobby.html"));
  });

  // handling room creation request --> emit & create new room
  lobbyRoutes.post("/rooms", hasLogin, (req, res) => {
    let roomName = getString(req, "name");
    if (getSessionUser(req)) {
      let owner = getSessionUser(req).username;
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

  return lobbyRoutes;
}
