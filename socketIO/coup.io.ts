import socket from "socket.io";
import express from "express";
import { Game } from "../coupGame";
import { deleteCoupGame, getGameById } from "../coupList";
import "../middleware";
import { logger } from "../logger";
import path from "path";

const filename = path.basename(__filename);

type GameJson = {
  my: { id: string; hand: number[]; faceUp: number[]; balance: number };
  otherPlayerList: { id: string; balance: number; state: string }[];
};

export async function addCoupSocketInitEvent(io: socket.Server) {
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;
    socket.on("askCoupInit", async (arg) => {
      logger.debug(`${filename} - On askCoupInit`);
      if (!req.session.user || !req.session.user.id) {
        logger.warn(`${filename} - Unauthorized access`);
        return;
      }
      const game: Game = await getGameById(arg.game.id);
      if (!game) {
        logger.error(`${filename} - Game not found`);
        return;
      }
      const my = game.playerList.find(
        (player) => player.userId === req.session.user?.id
      );
      if (!my) {
        logger.error(`${filename} - Player not found`);
        return;
      }
      socket.join(game.id);
      game.socketList.push(socket.id);
      const gameJson: GameJson = {
        my: {
          id: my.userId,
          hand: my.getHand(),
          faceUp: my.getFaceUp(),
          balance: my.getBalance(),
        },
        otherPlayerList: [],
      };
      // let i = 0;
      // for (let player of game.playerList) {
      //   if (player.userId !== my.userId) {
      //     gameJson.otherPlayerList[i] = {
      //       id: player.userId,
      //       balance: player.getBalance(),
      //       state: player.getState(),
      //     };
      //     i++;
      //   }
      // }

      gameJson.otherPlayerList = game.playerList
        .map(function (player) {
          return {
            id: player.userId,
            balance: player.getBalance(),
            state: player.getState(),
          };
        })
        .filter((player) => player.id !== my.userId);
      socket.emit("ansCoupInit", gameJson);
      addCoupSocketEvent(socket, req, game);
    });
  });
}

function addCoupSocketEvent(
  socket: socket.Socket,
  req: express.Request,
  game: Game
) {
  const userId = req.session.user?.id;
  if (!userId) {
    logger.warn(`${filename} - userId not found`);
    return;
  }
  socket.on("CoupInitFinished", () => {
    game.sendState();
  });
  socket.on("answerAction", (arg) => {
    logger.debug(`${filename} - answerAction from user: ${userId}, arg:${arg}`);
    game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerCounteraction", (arg) => {
    logger.debug(
      `${filename} - answerCounteraction from user: ${userId}, arg:${arg}`
    );
    game.addTransitionRecord({
      from: userId,
      arg: arg,
    });
    game.transition(arg);
  });
  socket.on("answerChallenge", (arg) => {
    logger.debug(
      `${filename} - answerChallenge from user: ${userId}, arg:${arg}`
    );
    game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerCard", (arg) => {
    logger.debug(`${filename} - answerCard from user: ${userId}, arg:${arg}`);
    game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerTarget", (arg) => {
    logger.debug(`${filename} - answerTarget from user: ${userId}, arg:${arg}`);
    game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("disconnect", () => {
    game.socketList.filter((socketId) => socketId != socket.id);
    logger.info(
      `${filename} - Socket disconnected, socket list: ${game.socketList}`
    );
    if (game.socketList.length <= 0) {
      deleteCoupGame(game.id);
    }
  });
}
