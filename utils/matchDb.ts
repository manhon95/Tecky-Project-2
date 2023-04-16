import database from "../db";
import { logger } from "../logger";
import path from "path";

const filename = path.basename(__filename);

/* ----------------------------- database query ----------------------------- */
export async function createGameInDB(gameName: string, userIdList: string[]) {
  const result = await database.query(
    /*sql*/ `
insert into "match" (match_name, match_date, winner_id)
values ($1, NOW(), NULL)
RETURNING id;
`,
    [gameName]
  );
  const gameId = String(result.rows[0].id);
  userIdList.forEach(async (userId) => {
    await database.query(
      /*sql*/ `
insert into "user_match" (player_id, match_id)
values ($1, $2)
`,
      [userId, gameId]
    );
  });
  return gameId;
}

export async function updateWinner(gameId: string, winnerId: string) {
  await database.query(`UPDATE "match" SET winner_id = $1 WHERE id = $2;`, [
    winnerId,
    gameId,
  ]);
}

async function updateEloInDB(playerId: number, amount: number) {
  await database.query(
    /*sql*/ `
update "user" 
SET elo = elo + $1
WHERE id = $2
`,
    [amount, playerId]
  );
}

export async function inMatch(playerId: string, matchId: string) {
  const result = await database.query(
    "select count(*) from user_match where player_id = $1 and match_id = $2",
    [playerId, matchId]
  );
  logger.debug(
    `${filename} - inMatch result: ${JSON.stringify(result.rows[0])}`
  );
  if (result.rows[0] > 1) {
    logger.warn(
      `${filename} - player_id: ${playerId} - match_id: ${matchId} have more than one entry in database`
    );
  }
  return result.rows[0] !== 0;
}
