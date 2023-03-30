import express, { Request, Response } from "express";
import session from "express-session";
import http from "http";
import { print } from "listening-on";
import socket from "socket.io";
import path from "path";
import { Game } from "./coupGame";
import { addCoupSocketFunction } from "./coupSocketFunction";
declare module "express-session" {
  interface SessionData {
    user: { id: string; firstName: string };
    socketList: string[];
  }
}

const app = express();
const server = http.createServer(app);
const io = new socket.Server(server);

/* -------------------------------- init game ------------------------------- */
let game: Game;

let roomPlayerList: string[] = [];

const sessionMiddleware = session({
  secret: "alpha-secret",
  resave: true,
  saveUninitialized: true,
});
app.use(express.static("../Public"));
app.use(sessionMiddleware);

io.use((socket, next) => {
  let req = socket.request as express.Request;
  let res = req.res as express.Response;
  sessionMiddleware(req, res, next as express.NextFunction);
});

app.get("/test", (req: Request, res: Response) => {
  res.sendFile(path.resolve("../Public", "testgameroom.html"));
});

app.get("/coup", (req: Request, res: Response) => {
  res.sendFile(path.resolve("../Public", "coup-game.html"));
});

type GameJson = {
  my: { id: string; hand: number[]; balance: number };
  otherPlayerList: { id: string; balance: number }[];
};

io.on("connection", (socket) => {
  const req = socket.request as express.Request;
  // setup user id
  req.session.user = {
    id: req.sessionID.slice(0, 4),
    firstName: req.sessionID.slice(5, 8),
  };
  req.session.save();
  // player join room
  socket.on("askPlayerIn", () => {
    req.session.socketList = req.session.socketList
      ? [...req.session.socketList, socket.id]
      : [socket.id];
    console.log("socketList: ", req.session.socketList);
    // every session contain a socketList contain all the socket.id from the session
    req.session.save();
    if (req.session.user && !roomPlayerList.includes(req.session.user.id)) {
      roomPlayerList.push(req.session.user.id);
    }
    io.emit("playerIn", { roomPlayerList: roomPlayerList });
  });
  socket.on("gameStart", () => {
    console.log(roomPlayerList);
    /* -------------------------------- important ------------------------------- */
    game = new Game("1", roomPlayerList, io);
    /* ----------------------------------- end ---------------------------------- */
    //game.playerList[0].setSocket(socket);
    io.emit("gameCreated");
  });

  socket.on("disconnect", () => {
    if (req.session.socketList) {
      req.session.socketList = req.session.socketList.filter(
        (socketId) => socketId !== socket.id
      );
    }
    req.session.save();
    if (
      req.session.user &&
      roomPlayerList.includes(req.session.user.id) &&
      req.session.socketList?.length == 0
    ) {
      roomPlayerList = roomPlayerList.filter(
        (player) => player !== req.session.user?.id
      );
    }
    io.emit("playerIn", { roomPlayerList: roomPlayerList });
  });
  /* -------------------------------- important ------------------------------- */
  addCoupSocketFunction(io, socket, game, req.session);
  /* ----------------------------------- end ---------------------------------- */
});
app.get("/checkSession", (req, res) => {
  console.log("sessionID", req.sessionID);
});

server.listen(8000, () => {
  print(8000);
});
