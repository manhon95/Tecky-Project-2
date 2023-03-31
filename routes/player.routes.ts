import { Router } from "express";
import socketIO from "socket.io";
import { botName } from "../socketIO/socketIOManager";
import { formatMessage } from "../utils/messages";
import database from "../db";
import {
  getCurrentPlayer,
  getRoomPlayers,
  togglePlayerReady,
} from "../utils/players";
import { io } from "../socketIO/socketIOManager";

export const playerRoutes = Router();

// handling check if player are friends
playerRoutes.get("/friends/:userId1/:userId2", async (req, res) => {
  // console.log({ id1: req.params.userId1, id2: req.params.userId2 });
  const userId1 = +req.params.userId1;
  const userId2 = +req.params.userId2;
  let result = await database.query(
    /* sql */ `
  select * from "friend_request"
  where ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
  AND accept_time IS NOT NULL
      `,
    [userId1, userId2]
  );
  if (result.rows.length === 0) {
    res.json({ areFriends: false });
    return;
  }
  res.json({ areFriends: true });
});
