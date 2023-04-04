import express, { Request, Response } from "express";
import session from "express-session";
import http from "http";
import { print } from "listening-on";
import socket from "socket.io";
import path from "path";
import { Game } from "./coupGame";
import { addCoupSocketFunction } from "./coupSocketFunction";
import { createCoupGame, getGameById } from "./coupGameList";
import "../middleware";

declare module "express-session" {
  interface SessionData {
    socketList: string[];
  }
}

const app = express();
const server = http.createServer(app);
const io = new socket.Server(server);

/* -------------------------------- init game ------------------------------- */

let roomPlayerList: string[] = [];

const sessionMiddleware = session({
  secret: "alpha-secret",
  resave: true,
  saveUninitialized: true,
});
app.use(express.static("../public"));
app.use(express.static("../protected"));
app.use(sessionMiddleware);

io.use((socket, next) => {
  let req = socket.request as express.Request;
  let res = req.res as express.Response;
  sessionMiddleware(req, res, next as express.NextFunction);
});

app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.resolve("../protected", "testgameroom.html"));
});

app.get("/coup", (req: Request, res: Response) => {
  if (typeof req.query.game == "string" && getGameById(req.query.game)) {
    res.sendFile(path.resolve("../protected", "coup-game.html"));
  } else {
    res.redirect("/");
  }
});

io.on("connection", (socket) => {
  const req = socket.request as express.Request;
  // setup user id
  req.session.user = {
    id: req.sessionID.slice(0, 4),
    username: req.sessionID.slice(5, 8),
    profilePic: null,
  };
  req.session.save();
  if (req.session.user.id == null) {
    throw new Error("user not found");
  }
  let myId = req.session.user.id;
  // player join room
  socket.on("askPlayerIn", () => {
    req.session.socketList = req.session.socketList
      ? [...req.session.socketList, socket.id]
      : [socket.id];
    // every session contain a socketList contain all the socket.id from the session
    req.session.save();
    if (req.session.user && !roomPlayerList.includes(myId)) {
      roomPlayerList.push(myId);
    }
    io.emit("playerIn", { roomPlayerList: roomPlayerList });
  });
  socket.on("gameStart", () => {
    let gameName = "1";
    let gameId = "1";
    /* -------------------------------- important ------------------------------- */
    createCoupGame(gameName, gameId, roomPlayerList, io);
    /* ----------------------------------- end ---------------------------------- */
    //game.playerList[0].setSocket(socket);
    io.emit("gameCreated", { game: { id: gameId } });
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
      roomPlayerList.includes(myId) &&
      req.session.socketList?.length == 0
    ) {
      roomPlayerList = roomPlayerList.filter((player) => player !== myId);
    }
    io.emit("playerIn", { roomPlayerList: roomPlayerList });
  });
  /* -------------------------------- important ------------------------------- */
  addCoupSocketFunction(io, socket, req.session);
  /* ----------------------------------- end ---------------------------------- */
});
app.get("/checkSession", (req, res) => {
  console.log("sessionID", req.sessionID);
});

server.listen(8000, () => {
  print(8000);
});
