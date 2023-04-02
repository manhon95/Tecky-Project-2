import database from "./db";
import { Request, Response } from "express";

/* ------------------------------ route handler ----------------------------- */
export async function getUnboughtBadges(req: Request, res: Response) {
  console.log("get badges triggered");
  let badges = await readUnboughtFromDB(+req.params.id);
  res.json({ badges });
}

export async function getUserCoins(req: Request, res: Response) {
  let coins = await readUserCoinsFromDB(+req.params.id);

  res.json(coins);
}

/* ---------------------------- database function --------------------------- */
async function readUnboughtFromDB(userId: number) {
  let result = await database.query(
    /*sql*/ `
    SELECT name, price, url
    FROM badge
    WHERE id NOT IN (
      SELECT badge_id
      FROM user_badge
      Where owner_id = $1
    );
`,
    [userId]
  );
  return result.rows;
}

async function readUserCoinsFromDB(userId: number) {
  let result = await database.query(
    /*sql*/ `
select coins from "user" where id = ($1)
`,
    [userId]
  );
  return result.rows[0];
}
