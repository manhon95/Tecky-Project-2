import SocketIO from 'socket.io';
import { Application } from 'express';
import { getCurrentPlayer, getRoomPlayers, playerJoin, playerLeave } from './utils/players';
import { formatMessage } from './utils/messages';
import { rooms } from './routes/room.routes';

// counter for socketIO connection
let onlineCount = 0

// displaying system message with this name
const botName = "Coup Bot";

export function initSocketServer(app: Application, httpServer: any) {
  const io = new SocketIO.Server(httpServer);
  // Alert server upon new connection & increment the counter
  io.on("connection", (socket) => {
    // Alert server upon new connection & increment the counter
    onlineCount++
    io.emit('online-count', onlineCount);

    socket.on("joinRoom", ({ username, room, rid }) => {
      // console.log(socket.id);
      const user = playerJoin(socket.id, username, room, false);
      // console.log(`room${rid} has new comer`);
      rooms[rid].count++;
      io.emit('new-inc', rooms[rid]);
      socket.join(user.room);
      // Welcome current user
      socket.emit("message", formatMessage(botName, "Welcome to Coup!, enjoy the game!"));

      // Broadcast when a user connects
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} has joined the game!`)
        );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomPlayers(user.room),
      });
    });

    // User leave the room 
    socket.on("leave-room", (room_id) => {
      console.log(`${room_id} has people left`)
      rooms[room_id].count--;
      io.emit('new-inc', rooms[room_id]);
    })

    // Listen for chatMessage
    socket.on("chatMessage", (msg) => {
      const user = getCurrentPlayer(socket.id);
      if (user) {
        io.to(user.room).emit("message", formatMessage(user.username, msg));
      }
    });

    // Runs when client disconnects
    socket.on("disconnect", () => {
      // game lobby part
      onlineCount--
      io.emit('online-count', onlineCount);

      // chatroom demo part
      const user = playerLeave(socket.id);
      if (user) {
        io.to(user.room).emit(
          "message",
          formatMessage(botName, `${user.username} has left the chat`)
        );

        // Send users and room info
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: getRoomPlayers(user.room),
        });
      }
    });
  });

  return io;
}