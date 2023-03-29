import { Router } from "express";
import socketIO from "socket.io";
import { botName } from "../socketIOManager";
import { formatMessage } from "../utils/messages";
import { client } from "../db";
import {
  getCurrentPlayer,
  getRoomPlayers,
  togglePlayerReady,
} from "../utils/players";

export function createPlayerRoutes(io: socketIO.Server) {
  let playerRoutes = Router();

  // handling patch player ready state request
  playerRoutes.patch("/player/ready", (req, res) => {
    let allPlayerReady = togglePlayerReady(req, res);
    // Send players and room info
    let player = getCurrentPlayer(req.body.id);
    if (player) {
      io.to(player.room).emit("room-players", {
        room: player.room,
        players: getRoomPlayers(player.room),
      });

      // count down and force redirect
      if (allPlayerReady) {
        // console.log("all ready, game start");
        let countdown = 3;

        const countdownInterval = setInterval(() => {
          if (player) {
            io.to(player.room).emit(
              "message",
              formatMessage(botName, `${countdown} second to the game start`)
            );
          }
          countdown--;

          if (countdown < 0) {
            clearInterval(countdownInterval);
            // create game function (io, playerIdList)
            io.emit("redirect-to-game");
          }
        }, 1000);
      }
    }
  });

  // handling check if player are friends
  playerRoutes.get("/friends/:userId1/:userId2", async (req, res) => {
    // console.log({ id1: req.params.userId1, id2: req.params.userId2 });
    const userId1 = +req.params.userId1;
    const userId2 = +req.params.userId2;
    let result = await client.query(
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

  return playerRoutes;
}
