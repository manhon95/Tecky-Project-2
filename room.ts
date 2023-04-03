import { Request, Response } from "express";
import database from "./db";
import moment from "moment";

/* ----------------------- function for socketIO ----------------------- */

// Room related info are all stored in RAM
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

export function formatMessage(username: string, text: string) {
  return {
    username,
    text,
    time: moment().format("h:mm a"),
  };
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

export function togglePlayerReady(clientSocketID: string) {
  players.map((player) => {
    if (player.socketId == clientSocketID) {
      player.ready = !player.ready;
    }
  });
  let currentRoom = getCurrentPlayer(clientSocketID)?.room;
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

/* ------------------------ function for Router handler ----------------------- */
export async function checkFriends(req: Request, res: Response) {
  res.json({
    areFriends: await checkFriendsInDB(
      +req.params.userId1,
      +req.params.userId2
    ),
  });
}

export async function postFriendRequest(req: Request, res: Response) {
  createFriendRequestInDB(+req.params.sender_id, +req.params.receiver_id);
  // TODO: refine the condition, user may already added this friend or added too many times
  res.json({});
}

/* ----------------------- function for Database query ---------------------- */
async function createFriendRequestInDB(senderId: number, receiverId: number) {
  let result = await database.query(
    /*sql*/ `
insert into "friend_request" (sender_id, receiver_id, message)
values ($1, $2, 'default message');
`,
    [senderId, receiverId]
  );
}

async function checkFriendsInDB(userId1: number, userId2: number) {
  let result = await database.query(
    /* sql */ `
  select * from "friend_request"
  where ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
  AND accept_time IS NOT NULL
      `,
    [userId1, userId2]
  );
  return result.rows.length !== 0;
}
