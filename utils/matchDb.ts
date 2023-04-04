import database from "../db";

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
