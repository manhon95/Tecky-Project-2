import { Game, GameSave2 } from "./coupGame";
import fs from "fs";
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
    new Game(gameName, gameId, io, {
      snapshotMode: false,
      playerIdList: playerIdList,
    })
  );
  logger.info(
    `${filename} - Game Created id: ${gameId}, name: ${gameName}, player_list: ${playerIdList}`
  );
}

export function loadCoupGame(gameId: string) {
  try {
    const contents = fs.readFileSync(`coupSave/${gameId}.json`);
    const save: GameSave2 = JSON.parse(contents.toString());
    gameList.set(
      gameId,
      new Game(save.name, gameId, io, { snapshotMode: true, save2: save })
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
