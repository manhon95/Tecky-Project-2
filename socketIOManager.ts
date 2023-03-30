import SocketIO from "socket.io";
import { Application } from "express";
import {
  getCurrentPlayer,
  getRoomPlayers,
  playerJoin,
  playerLeave,
  togglePlayerReady,
} from "./utils/players";
import { formatMessage } from "./utils/messages";
import { rooms } from "./routes/room.routes";
import express from "express";
import { createCoupGame } from "./coupGame/coupGameList";
import { addCoupSocketFunction } from "./coupGame/coupSocketFunction";

// counter for socketIO connection
let onlineCount = 0;

// displaying system message with this name
export const botName = "Coup Bot";

export function initSocketServer(app: Application, httpServer: any) {
  const io = new SocketIO.Server(httpServer);
  // Alert server upon new connection & increment the counter
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;
    console.log(req.session.user?.id);
    // Alert server upon new connection & increment the counter
    onlineCount++;
    io.emit("online-count", onlineCount);

    socket.on("join-room", ({ username, room, rid, currentUserId }) => {
      // console.log(socket.id);
      const player = playerJoin(
        socket.id,
        username,
        room,
        false,
        currentUserId
      );

      rooms[rid].count++;
      io.emit("new-inc", rooms[rid]);
      socket.join(player.room);
      // Welcome current player
      socket.emit(
        "message",
        formatMessage(botName, `Hello ${username}, enjoy the Coup!`)
      );

      // Broadcast when a player connects
      socket.broadcast
        .to(player.room)
        .emit(
          "message",
          formatMessage(botName, `${player.username} has joined the game!`)
        );

      // Send players and room info
      io.to(player.room).emit("room-players", {
        room: player.room,
        players: getRoomPlayers(player.room),
      });
    });

    // socketIO version of ready
    socket.on("ready", (clientSocketID) => {
      // console.log(
      //   `userID ${req.session.user?.id} ready, with socketID ${clientSocketID}`
      // );
      let allPlayerReady = togglePlayerReady(clientSocketID);
      // Send players and room info
      let player = getCurrentPlayer(clientSocketID);
      if (player) {
        io.to(player.room).emit("room-players", {
          room: player.room,
          players: getRoomPlayers(player.room),
        });

        // count down and force redirect
        if (allPlayerReady) {
          // console.log("all ready, game start");
          let countdown = 3;

          /* ----------------------------- GAME START PART ---------------------------- */
          const countdownInterval = setInterval(() => {
            if (player) {
              io.to(player.room).emit(
                "message",
                formatMessage(botName, `${countdown} second to the game start`)
              );
              countdown--;

              if (countdown < 0) {
                clearInterval(countdownInterval);
                let players = getRoomPlayers(player.room);
                let gameId = player.room;
                let roomPlayerList: string[] = [];
                players.map((player) => {
                  roomPlayerList.push(player.userId.toString());
                });
                // pass arg to victor function here

                createCoupGame(gameId, roomPlayerList, io);
                io.emit("redirect-to-game");
              }
            }
          }, 1000);
        }
      }
    });

    // User leave the room
    socket.on("leave-room", (room_id) => {
      if (rooms[room_id]?.count !== undefined) {
        rooms[room_id].count--;
        io.emit("new-inc", rooms[room_id]);
      }
    });

    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const player = getCurrentPlayer(socket.id);
      if (player) {
        io.to(player.room).emit("message", formatMessage(player.username, msg));
      }
    });

    // Runs when client disconnects
    socket.on("disconnect", () => {
      // game lobby part
      onlineCount--;
      io.emit("online-count", onlineCount);

      // chatroom demo part
      const player = playerLeave(socket.id);
      if (player) {
        io.to(player.room).emit(
          "message",
          formatMessage(botName, `${player.username} has left the chat`)
        );
        let filteredRoom = rooms.filter((room) => {
          return room.name === player.room;
        });
        let roomPlayerLeft = rooms[filteredRoom[0].id];
        if (roomPlayerLeft?.count !== undefined) {
          roomPlayerLeft.count--;

          io.emit("new-inc", roomPlayerLeft);
        }
        // Send players and room info
        io.to(player.room).emit("room-players", {
          room: player.room,
          players: getRoomPlayers(player.room),
        });
      }
    });
    // console.log(req.session.user?.id);
    /* ---------------------------------- TODO ---------------------------------- */

    addCoupSocketFunction(io, socket, req.session);
  });

  return io;
}
