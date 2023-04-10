import { Game } from "./coupGame";
import { io } from "./socketIO/socketIOManager";
import { logger } from "./logger";
import path from "path";

const filename = path.basename(__filename);

const gameList = new Map();

export function createCoupGame(
  gameName: string,
  gameId: string,
  playerIdList: string[]
) {
  gameList.set(
    gameId,
    new Game(gameId, io, {
      snapshotMode: false,
      name: gameName,
      playerIdList: playerIdList,
    })
  );
  logger.info(
    `${filename} - Game Created id: ${gameId}, name: ${gameName}, player_list: ${playerIdList}`
  );
}

export function loadCoupGame(gameId: string) {
  try {
    gameList.set(
      gameId,
      new Game(gameId, io, { snapshotMode: true, save2: true })
    );
    logger.info(`${filename} - Game Loaded id: ${gameId}`);
  } catch (e) {
    logger.warn(`${filename} - Game save file error: ${e}`);
  }
  return;
}

export function deleteCoupGame(gameId: string) {
  gameList.delete(gameId);
  logger.info(`${filename} - Game delete id: ${gameId}`);
}

export function getGameById(gameId: string): Game {
  logger.debug(`${filename} - In getGameById`);
  if (!gameList.has(gameId)) {
    loadCoupGame(gameId);
  }
  return gameList.get(gameId);
}
