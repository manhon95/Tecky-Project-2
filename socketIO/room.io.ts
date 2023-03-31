import socket from "socket.io";
import express from "express";
import { playerJoin } from "../utils/players";
import { formatMessage } from "../utils/messages";
import { botName } from "./socketIOManager";
import { rooms } from "../lobby";
import {
  getRoomPlayers,
  playerLeave,
  togglePlayerReady,
  getCurrentPlayer,
} from "../utils/players";
import { createCoupGame } from "../coupGame/coupGameList";

export function createRoomSocketEvent(io: socket.Server) {
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;

    socket.on("join-room", ({ username, room, rid, currentUserId }) => {
      console.log(socket.id);
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

      /* ------------------------ Add remain socket event ------------------------ */
      // When player receive a friend request
      socket.on("add-friend", ({ receiverSocketId, senderName }) => {
        io.to(receiverSocketId).emit("prompt-friend-request", senderName);
        // console.log(`${senderName} sent a request to ${receiverSocketId}`);
      });

      // socketIO version of ready
      socket.on("ready", () => {
        let allPlayerReady = togglePlayerReady(socket.id);
        // Send players and room info
        let player = getCurrentPlayer(socket.id);
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
                  formatMessage(
                    botName,
                    `${countdown} second to the game start`
                  )
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
          io.to(player.room).emit(
            "message",
            formatMessage(player.username, msg)
          );
        }
      });

      // Runs when client disconnects
      socket.on("disconnect", () => {
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
    });
  });
}