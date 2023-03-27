import "../session-middleware";
import { getString, HttpError } from "../utils/express";
import { Router } from "express";
import { getSessionUser, hasLogin } from "../guard";
import socketIO from "socket.io";
import path from "path";

type Room = {
  id: number;
  name: string;
  owner: string;
  count: number;
};
// Make the rooms global such that the socketIO manager can get them
export let rooms: Room[] = [];
export const roomCapacity = 2;

export function createRoomRoutes(io: socketIO.Server) {
  let roomRoutes = Router();

  let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0);

  // handling room creation request --> emit & create new room
  roomRoutes.post("/rooms", hasLogin, (req, res) => {
    let roomName = getString(req, "name");
    if (getSessionUser(req)) {
      let owner = getSessionUser(req).username;
      if (rooms.find((room) => room.owner === owner) !== undefined) {
        throw new HttpError(400, "You already own a room");
      }

      let room: Room = { id: maxRoomId, name: roomName, owner, count: 0 };
      rooms.push(room);
      res.json({ maxRoomId });
      maxRoomId++;
      io.emit("new-room", room);
    }
  });

  roomRoutes.get("/user/chat.html", (req, res) => {
    console.log(req.query.username, req.query.room);
    res.sendFile(path.resolve("protected", "chat.html"));
  });
  // showing all room content
  roomRoutes.get("/rooms", (req, res) => {
    res.json({ rooms });
  });

  // getting room max capacity
  roomRoutes.get("/capacity", (req, res) => {
    res.json({ roomCapacity });
  });

  return roomRoutes;
}
