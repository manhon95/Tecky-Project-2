import { Game, GameSave } from "./coupGame";
import { Server } from "socket.io";
import pfs from "fs/promises";

const gameList = new Map();

export function createCoupGame(
  gameName: string,
  gameId: string,
  playerIdList: string[],
  io: Server
) {
  gameList.set(
    gameId,
    new Game(gameName, gameId, io, { playerIdList: playerIdList })
  );
}

export function getGameById(gameId: string): Game {
  return gameList.get(gameId);
}

export async function loadCoupGame(gameId: string, io: Server) {
  const contents = await pfs.readFile(`save/${gameId}.json`);
  const save: GameSave = JSON.parse(contents.toString());
  gameList.set(gameId, new Game(save.name, gameId, io, { save: save }));
}
