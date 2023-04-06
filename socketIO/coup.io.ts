import socket from "socket.io";
import express from "express";
import { Game } from "../coupGame";
import { getGameById } from "../coupList";
import "../middleware";
import { logger } from "../logger";

type GameJson = {
  my: { id: string; hand: number[]; faceUp: number[]; balance: number };
  otherPlayerList: { id: string; balance: number; state: string }[];
};

export function addCoupSocketInitEvent(io: socket.Server) {
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;
    socket.on("askCoupInit", (arg) => {
      if (!req.session.user || !req.session.user.id) {
        throw new Error("User not found");
      }
      const game: Game = getGameById(arg.game.id);
      if (!game) {
        throw new Error("game not found");
      }
      const my = game.playerList.find(
        (player) => player.userId === req.session.user?.id
      );
      if (!my) {
        throw new Error("player not found");
      }
      socket.join(game.id);
      const gameJson: GameJson = {
        my: {
          id: my.userId,
          hand: my.getHand(),
          faceUp: my.getFaceUp(),
          balance: my.getBalance(),
        },
        otherPlayerList: [],
      };
      let i = 0;
      for (let player of game.playerList) {
        if (player.userId !== my.userId) {
          gameJson.otherPlayerList[i] = {
            id: player.userId,
            balance: player.getBalance(),
            state: player.getState(),
          };
          i++;
        }
      }

      socket.emit("ansCoupInit", gameJson);
      addCoupSocketEvent(socket, game);
    });
  });
}

function addCoupSocketEvent(socket: socket.Socket, game: Game) {
  socket.on("CoupInitFinished", () => {
    game.sendState();
  });
  socket.on("answerAction", (arg) => {
    logger.debug(`answerAction from socket ${socket.id}`);
    game.transition(arg);
  });
  socket.on("answerCounteraction", (arg) => {
    logger.debug(`answerAction from socket ${socket.id}`);
    game.transition(arg);
  });
  socket.on("answerChallenge", (arg) => {
    logger.debug(`answerAction from socket ${socket.id}`);
    game.transition(arg);
  });
  socket.on("answerCard", (arg) => {
    logger.debug(`answerAction from socket ${socket.id}`);
    game.transition(arg);
  });
  socket.on("answerTarget", (arg) => {
    logger.debug(`answerAction from socket ${socket.id}`);
    game.transition(arg);
  });
}
