import socket from "socket.io";
import express from "express";
import { Game, TransitionSave } from "../coupGame";
import { deleteCoupGame, getGameById } from "../coupList";
import "../middleware";
import { logger } from "../logger";
import path from "path";
import { readUsernameFromDB } from "../utils/user";

const filename = path.basename(__filename);

type GameJson = {
  my: {
    id: string;
    name: string;
    hand: number[];
    faceUp: number[];
    balance: number;
  };
  otherPlayerList: {
    id: string;
    name: string;
    balance: number;
    state: string;
  }[];
  transitionRecords?: TransitionSave[];
};

export function addCoupSocketInitEvent(io: socket.Server) {
  io.on("connection", (socket) => {
    const req = socket.request as express.Request;
    socket.on("askCoupInit", async (arg) => {
      logger.debug(`${filename} - In askCoupInit`);
      if (!req.session.user || !req.session.user.id) {
        logger.warn(`${filename} - Unauthorized access`);
        return;
      }
      const game: Game = getGameById(arg.game.id);
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
      logger.info(`${filename} - Socket ${socket.id} join`);
      logger.debug(`${filename} - socket list: ${game.socketList}`);
      const gameJson: GameJson = {
        my: {
          id: my.userId,
          name: await readUsernameFromDB(+my.userId),
          hand: my.getHand(),
          faceUp: my.getFaceUp(),
          balance: my.getBalance(),
        },
        otherPlayerList: [],
        transitionRecords: game.getTransitionRecords(),
      };
      gameJson.otherPlayerList = await Promise.all(
        game.playerList.map(async function (player) {
          return {
            id: player.userId,
            name: await readUsernameFromDB(+player.userId),
            balance: player.getBalance(),
            state: player.getState(),
          };
        })
      );
      gameJson.otherPlayerList = gameJson.otherPlayerList.filter(
        (player) => player.id !== my.userId
      );
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
    game.sendState(socket);
  });
  socket.on("answerAction", (arg) => {
    logger.debug(
      `${filename} - answerAction from user: ${userId}, arg:${JSON.stringify(
        arg
      )}`
    );
    // game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerCounteraction", (arg) => {
    logger.debug(
      `${filename} - answerCounteraction from user: ${userId}, arg:${JSON.stringify(
        arg
      )}`
    );
    // game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerChallenge", (arg) => {
    logger.debug(
      `${filename} - answerChallenge from user: ${userId}, arg:${JSON.stringify(
        arg
      )}`
    );
    // game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerCard", (arg) => {
    logger.debug(
      `${filename} - answerCard from user: ${userId}, arg:${JSON.stringify(
        arg
      )}`
    );
    // game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("answerTarget", (arg) => {
    logger.debug(
      `${filename} - answerTarget from user: ${userId}, arg:${JSON.stringify(
        arg
      )}`
    );
    // game.addTransitionRecord({ from: userId, arg: arg });
    game.transition(arg);
  });
  socket.on("disconnect", () => {
    logger.info(`${filename} - Socket ${socket.id} disconnected`);
    game.socketList = game.socketList.filter(
      (socketId) => socketId != socket.id
    );
    logger.debug(`${filename} - socket list: ${game.socketList}`);
    if (game.socketList.length <= 0) {
      deleteCoupGame(game.id);
    }
  });
}
