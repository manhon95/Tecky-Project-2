import SocketIO from "socket.io";
import { Application } from "express";
import {
  getCurrentPlayer,
  getRoomPlayers,
  playerJoin,
  playerLeave,
} from "./utils/players";
import { formatMessage } from "./utils/messages";
import { rooms } from "./routes/room.routes";

// counter for socketIO connection
let onlineCount = 0;

// displaying system message with this name
export const botName = "Coup Bot";

export function initSocketServer(app: Application, httpServer: any) {
  const io = new SocketIO.Server(httpServer);
  // Alert server upon new connection & increment the counter
  io.on("connection", (socket) => {
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
        formatMessage(botName, "Welcome to Coup!, enjoy the game!")
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

    // User leave the room
    socket.on("leave-room", (room_id) => {
      // console.log(`${room_id} has people left`);
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

        // Send players and room info
        io.to(player.room).emit("room-players", {
          room: player.room,
          players: getRoomPlayers(player.room),
        });
      }
    });
  });

  return io;
}
