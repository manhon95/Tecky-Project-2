import { Router } from "express";
import socketIO from "socket.io";
import { client } from "../db";

export function createBadgeRoutes(io: socketIO.Server) {
  let badgeRoutes = Router();

  // Return badge link when asked
  badgeRoutes.get("/badges/:userId", async (req, res) => {
    let userId = +req.params.userId;
    // console.log(userId);
    let badges = await getBadgesFromDB(userId);
    // console.log(badges);
    res.json({ badges });
  });

  return badgeRoutes;
}

async function getBadgesFromDB(userId: number) {
  let result = await client.query(
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