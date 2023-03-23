import express, { NextFunction, Request, Response } from 'express'

import path from 'path';
import http from 'http';
import socketIO from 'socket.io';
import { print } from 'listening-on';
import { sessionMiddleware } from './session-middleware';

import { formatMessage } from './utils/messages';
import { getCurrentUser, getRoomUsers, userJoin, userLeave } from './utils/users';
import { userRoutes } from './routes/user.routes'

let app = express()
let server = http.createServer(app)
let io = new socketIO.Server(server)

// counter for socketio connection
let onlineCount = 0

// decode middleware definition(added some error checking)
let urlencoded = (req: Request, res: Response, next: NextFunction) => {
  let type = req.headers['content-type']
  if (type !== 'application/x-www-form-urlencoded') {
    next()
    return
  }
  req.on('data', data => {
    let str = data.toString()
    let body = new URLSearchParams(str)
    req.body = {}
    for (let [key, value] of body.entries()) {
      // console.log({ key, value })
      req.body[key] = value
    }
    next()
  })
}
let json = (req: Request, res: Response, next: NextFunction) => {
  let type = req.headers['content-type']
  if (type !== 'application/json') {
    next()
    return
  }
  req.on('data', data => {
    let str = data.toString()
    req.body = JSON.parse(str)
    next()
  })
}
// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// decode middleware
app.use(urlencoded);
app.use(json);
app.use(sessionMiddleware)
const botName = "Coup Bot";

// other resources routing
app.use(userRoutes)

// Error handling middleware
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if ('statusCode' in error) {
    res.status(error.statusCode)
  } else {
    res.status(500)
  }
  let message = String(error)
  message = message.replace(/\w+: /, '')
  res.json({
    error: message,
  })
})
// Report route not found
app.use((req, res, next) => {
  res.status(404)
  res.json({ error: 'Route not found' })
})
// Run when client connects
io.on("connection", (socket) => {
  // Alert server upon new connection & increment the counter
  console.log('connection established, id:', socket.id);
  onlineCount++
  io.emit('online-count', onlineCount);

  socket.on("joinRoom", ({ username, room }) => {
    console.log(socket.id);
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    // Welcome current user
    socket.emit("message", formatMessage(botName, "Welcome to ChatCord!"));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} has joined the chat!`)
      );

    // Send users and room info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    if (user) {
      io.to(user.room).emit("message", formatMessage(user.username, msg));
    }
  });

  // Runs when client disconnects
  socket.on("disconnect", () => {
    // game lobby part
    console.log('disconnected , id:', socket.id)
    onlineCount--
    io.emit('online-count', onlineCount);

    // chatroom demo part
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = 8100;

server.listen(PORT, () => {
  print(PORT)
});