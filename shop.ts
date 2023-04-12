import database from "./db";
import { HttpError } from "./utils/express";
import { Request, Response } from "express";

/* ------------------------------ route handler ----------------------------- */
export async function getUnboughtBadges(req: Request, res: Response) {
  let badges = await readUnboughtFromDB(+req.params.id);
  res.json({ badges });
}

export async function getUserCoins(req: Request, res: Response) {
  let coins = await readUserCoinsFromDB(+req.params.id);

  res.json(coins);
}
export async function postBadgeOwner(req: Request, res: Response) {
  const userId = +req.params.userId;
  const badgeId = +req.params.badgeId;

  const badgePrice = await readBadgePriceFromDB(badgeId);
  const userCoins = await readUserCoinsFromDB(userId);

  console.log({ userCoins, badgePrice });
  if (userCoins < badgePrice) {
    throw new HttpError(400, "Not enough coins");
  }
  // deduct user coins;
  updateUserCoinsInDB(userId, badgePrice);
  createBadgeOwnerInDB(userId, badgeId);
  res.json({});
}

/* ---------------------------- database function --------------------------- */
async function readUnboughtFromDB(userId: number) {
  let result = await database.query(
    /*sql*/ `
    SELECT id, name, price, url
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
  return result.rows[0].coins;
}

async function createBadgeOwnerInDB(ownerId: number, badgeId: number) {
  let result = await database.query(
    /*sql*/ `
    insert into "user_badge" (owner_id, badge_id) values ($1, $2);
    `,
    [ownerId, badgeId]
  );
}

async function readBadgePriceFromDB(badgeId: number) {
  let result = await database.query(
    /*sql*/ `
select price from "badge" where id = ($1)
`,
    [badgeId]
  );
  return result.rows[0].price;
}

async function updateUserCoinsInDB(userId: number, price: number) {
  let result = await database.query(
    /*sql*/ `
update "user" set coins = coins - $1 where id = $2
    `,
    [price, userId]
  );
  console.log(result.rows[0]);
}
