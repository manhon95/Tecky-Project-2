import { Router } from 'express';
import socketIO from 'socket.io';
import { botName } from '../socketIOManager';
import { formatMessage } from '../utils/messages';
import { getCurrentPlayer, getRoomPlayers, togglePlayerReady } from '../utils/players';


export function createPlayerRoutes(io: socketIO.Server) {
  let playerRoutes = Router();

  // handling patch player ready state request
  playerRoutes.patch('/player/ready', (req, res) => {
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
        console.log("all ready, game start");
        let countdown = 3;

        const countdownInterval = setInterval(() => {
          if (player) {
            io.to(player.room).emit("message", formatMessage(botName, `${countdown} second to the game start`));
          }
          countdown--;

          if (countdown < 0) {
            clearInterval(countdownInterval);
            io.emit('redirect-to-game');
          }
        }, 1000);
      }
    }

    res.json({ success: true });
  })

  return playerRoutes
}