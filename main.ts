import express, { NextFunction, Request, Response } from "express";
import { saveUserDetails } from "./manageUserAccount";
import { passwordChecker } from "./LoginAuthenticate";
import { print } from "listening-on";
import path from "path";
import { sessionMiddleWare } from "./session-middleWare";
import { isLoggedIn } from "./guard";
import socketIO from 'socket.io';
import http from 'http';
import { rooms, roomRoutes } from './routes/room.routes';
import { formatMessage } from './utils/messages';
import { getCurrentPlayer, getRoomPlayers, playerJoin, playerLeave } from './utils/players';


let botName = "system";
let app = express();
let server = http.createServer(app)
export let io = new socketIO.Server(server)

app.use(express.static("public"));
app.use(express.urlencoded());
app.use(express.json());
app.use(sessionMiddleWare)
app.use(roomRoutes)
let onlineCount = 0
io.on("connection", (socket) => {
  // Alert server upon new connection & increment the counter
  onlineCount++
  io.emit('online-count', onlineCount);

  // update room player count when someone join the room
  socket.on('inc-room-count', (room_id) => {

    // rooms[room_id].count++;

  })
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

// app.post()
app.post("/register", (req: Request, res: Response) => {
  saveUserDetails(req, res);
});
app.post("/login", (req: Request, res: Response) => {
  passwordChecker(req, res);
});
app.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login-page.html"));
});
app.use(isLoggedIn, express.static('protected'))

app.get('/gameroom', (req: Request, res: Response) => {
  res.sendFile(path.resolve("protected", "gameroom.html"));
});

app.get('/username', (req, res) => {
  // console.log("having get role req")
  let username = req.session.user?.firstName
  res.json({
    username
  })
})

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


// app.use((req: Request, res: Response) => {
//   res.redirect("/login");
// });

// app.get("/submit" )
const PORT = 8080;
server.listen(PORT, () => {
  print(PORT);
});
