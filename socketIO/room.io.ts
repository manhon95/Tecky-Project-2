import socket from "socket.io";
import express from "express";
import { botName } from "./socketIOManager";
import { rooms } from "../utils/roomInfo";
import {
  formatMessage,
  playerJoin,
  getRoomPlayers,
  playerLeave,
  togglePlayerReady,
  getCurrentPlayer,
} from "../room";
import { createCoupGame } from "../coupList";
import { createGameInDB } from "../utils/matchDb";
import { begin, commit, rollback } from "../db";
import { logger } from "../logger";
import path from "path";

function timer(t: number) {
  return new Promise((rec) => setTimeout(() => rec(true), t));
}

const rngTime = () => Math.floor(Math.random() * 300);

const filename = path.basename(__filename);
export function addRoomSocketInitEvent(io: socket.Server) {
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;

    socket.on("askRoomInit", ({ username, room, myId }) => {
      const randomTime = Math.floor(Math.random() * 1000);

      let rid = rooms.findIndex((rmName) => rmName.name == room);
      // if room.playing == true, set it back to false(people returning to lobby)
      if (!rooms[rid]) {
        logger.warn(`${filename} - Unauthorized access`);
        return;
      }

      // if (rooms[rid].playing) {
      //   rooms[rid].playing = false;
      // }

      const player = playerJoin(socket.id, username, room, false, myId);

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

      // updateRoomPlayerInfo(io, player.room);
      setTimeout(() => {
        updateRoomPlayerInfo(io, player.room);
      }, randomTime);

      //put all server logic here when the Page is loaded
      addRoomSocketEvent(socket, io); //remain socket event is added when Page is Load
    });
  });
}

function addRoomSocketEvent(socket: socket.Socket, io: socket.Server) {
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
      updateRoomPlayerInfo(io, player.room);

      // count down and force redirect
      if (allPlayerReady) {
        // console.log("all ready, game start");
        if (player) {
          let playerRoom = player.room;
          let roomIdx = rooms.findIndex((room) => room.name == playerRoom);
          rooms[roomIdx].playing = true;
          io.emit("new-inc", rooms[roomIdx]);
        }
        let countdown = 3;

        /* ----------------------------- GAME START PART ---------------------------- */
        const countdownInterval = setInterval(async () => {
          if (player) {
            io.to(player.room).emit(
              "message",
              formatMessage(botName, `${countdown} second to the game start`)
            );
            countdown--;
            // get room by room name

            if (countdown < 0) {
              clearInterval(countdownInterval);
              let players = getRoomPlayers(player.room);
              let gameName = player.room;
              let roomPlayerList: string[] = [];
              players.map((player) => {
                roomPlayerList.push(player.userId.toString());
              });
              // pass arg to victor function here
              // console.log(roomPlayerList);
              begin();
              try {
                const gameId = await createGameInDB(gameName, roomPlayerList);
                createCoupGame(gameName, gameId, roomPlayerList);

                io.emit("redirect-to-game", gameId);
              } catch (err) {
                rollback();
                throw err;
              }
              commit();
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
      updateRoomPlayerInfo(io, player.room);
    }
  });
}

async function updateRoomPlayerInfo(io: socket.Server, room: string) {
  const players = getRoomPlayers(room);

  await timer(rngTime());
  // console.log(players, "players before send");
  io.to(room).emit("room-players", {
    room: room,
    players,
  });
}
