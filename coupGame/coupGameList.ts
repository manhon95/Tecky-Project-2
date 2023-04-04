import { Game } from "./coupGame";
import { Server } from "socket.io";

const gameList = new Map();

export function createCoupGame(
  gameName: string,
  gameId: string,
  playerIdList: string[],
  io: Server
) {
  gameList.set(gameId, new Game(gameName, gameId, playerIdList, io));
}

export function getGameById(gameId: string): Game {
  return gameList.get(gameId);
}
