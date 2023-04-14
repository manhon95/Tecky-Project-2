import { getSessionUser } from "./guard";
import { getString, HttpError } from "./utils/express";
import { Request, Response } from "express";
import { io } from "./socketIO/socketIOManager";
import { Room, rooms } from "./utils/roomInfo";

export const roomCapacity = 4;
let maxRoomId = rooms.reduce((id, item) => Math.max(id, item.id), 0);

export function createRoomAndEmitMsg(req: Request, res: Response) {
  try {
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
      let room: Room = {
        id: maxRoomId,
        name: roomName,
        owner,
        count: 0,
        playing: false,
      };
      rooms.push(room);
      res.json({ maxRoomId });
      maxRoomId++;
      io.emit("new-room", room);
    }

    res.json({});
  } catch (error) {
    console.log(error);
    res.json({});
  }
}
