import database from "./db";

export async function updateMatchRecord(
  playerIdList: String[],
  matchName: string,
  winnerId: number
) {
  // 1. create the matchRecord
  console.log(
    `match ${matchName}, participant: ${playerIdList}, winnerId ${winnerId}`
  );
  const matchId = await createMatchInDB(matchName, winnerId);
  // 2. create the relevant user_match
  playerIdList.map(async (playerId) => {
    await createUserMatchRelationshipInDB(+playerId, matchId);
    if (+playerId == winnerId) {
      updateEloInDB(+playerId, 10);
    } else {
      updateEloInDB(+playerId, -5);
    }
  });
}

/* ----------------------------- database query ----------------------------- */
async function createMatchInDB(matchName: string, winnerId: number) {
  let result = await database.query(
    /*sql*/ `
insert into "match" (match_name, match_date, winner_id)
values ($1, NOW(), $2)
RETURNING id;
`,
    [matchName, winnerId]
  );
  return result.rows[0].id;
}

async function createUserMatchRelationshipInDB(
  userId: number,
  matchId: number
) {
  await database.query(
    /*sql*/ `
insert into "user_match" (player_id, match_id)
values ($1, $2)
`,
    [userId, matchId]
  );
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
