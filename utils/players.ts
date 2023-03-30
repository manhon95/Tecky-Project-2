import { roomCapacity } from "../routes/room.routes";
import { Request, Response } from "express";
// this user is for chatroom, not the session stuff from db
type Player = {
  socketId: string;
  username: string;
  room: string;
  ready: boolean;
  userId: number;
};
const players: Player[] = [];

// Join user to chat
export function playerJoin(
  socketId: string,
  username: string,
  room: string,
  ready: boolean,
  userId: number
) {
  const player = { socketId, username, room, ready, userId };

  players.push(player);

  return player;
}

export function getCurrentPlayer(id: string) {
  return players.find((player) => player.socketId === id);
}

// User leaves chat
export function playerLeave(id: string) {
  const index = players.findIndex((player) => player.socketId === id);
  if (index === -1) return;
  return players.splice(index, 1)[0];
}

// Get room players
export function getRoomPlayers(room: string) {
  return players.filter((player) => player.room === room);
}

export function togglePlayerReady(req: Request, res: Response) {
  players.map((player) => {
    if (player.socketId == req.body?.id) {
      player.ready = !player.ready;
    }
  });
  let currentRoom = getCurrentPlayer(req.body?.id)?.room;
  // get the player in the "just ready room" and do the checking
  if (currentRoom) {
    let playerInRoom = getRoomPlayers(currentRoom);
    let result = playerInRoom.reduce((acc, curr) => {
      return acc && curr.ready;
    }, true);
    return result && playerInRoom.length >= 2;
  }
  return;
}
