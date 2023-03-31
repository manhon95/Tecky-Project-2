import { Router } from "express";
import socketIO from "socket.io";
import database from "../db";
import { io } from "../socketIO/socketIOManager";

export const badgeRoutes = Router();

// Return badge link when asked
badgeRoutes.get("/badges/:userId", async (req, res) => {
  let userId = +req.params.userId;
  // console.log(userId);
  let badges = await getBadgesFromDB(userId);
  // console.log(badges);
  res.json({ badges });
});

async function getBadgesFromDB(userId: number) {
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
}
