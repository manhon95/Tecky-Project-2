import database from "./db";
import { Request, Response } from "express";

/* ------------------------------ route handler ----------------------------- */
export async function getAllFriends(req: Request, res: Response) {
  let friends = await readFriendsFromDB(+req.params.id);
  res.json({ friends });
}

export async function deleteFriend(req: Request, res: Response) {
  // console.log(`trying to delete ${userAId}, ${userBId}`);
  let success = await deleteFriendFromDB(+req.params.idA, +req.params.idB);
  // console.log("trying to delete " + success);
  res.json({ success });
}

export async function getFriendRequest(req: Request, res: Response) {
  let requests = await readFriendRequestFromDB(+req.params.id);
  res.json({ requests });
}

export async function acceptFriendRequest(req: Request, res: Response) {
  updateAcceptTimeInDB(+req.params.id);
  res.json({});
}

export async function rejectFriendRequest(req: Request, res: Response) {
  updateRejectTimeInDB(+req.params.id);
  res.json({});
}
/* ---------------------------- database function --------------------------- */
async function readFriendsFromDB(id: number | undefined) {
  let result = await database.query(
    /*sql*/ `
SELECT id, user_name, email, elo 
FROM "user" 
INNER JOIN (
  SELECT 
      CASE
          WHEN sender_id = $1 THEN receiver_id
          ELSE sender_id
      END AS friend_id
  FROM 
      friend_request
  WHERE 
      (sender_id = $1 OR receiver_id = $1)
      AND accept_time IS NOT NULL
) as f ON "user".id = f.friend_id;
  `,
    [id]
  );
  return result.rows;
}

async function readFriendRequestFromDB(id: number) {
  let result = await database.query(
    /*sql*/ `
select 
  fr.id,
  u.user_name as sender_name,
  fr.message
from 
  friend_request fr
INNER JOIN
  "user" u ON fr.sender_id = u.id
WHERE
  fr.receiver_id = $1
  AND fr.accept_time IS NULL AND fr.reject_time IS NULL;
`,
    [id]
  );
  return result.rows;
}

async function deleteFriendFromDB(userAId: number, userBId: number) {
  let result = await database.query(
    /*sql*/ `
DELETE FROM friend_request
WHERE (sender_id = $1 AND receiver_id = $2)
OR (sender_id = $2 AND receiver_id = $1)
`,
    [userAId, userBId]
  );
  // TO-DO
  // if rowCount != 0 that means successful deletion
  // console.log(result.rowCount);
  return result.rowCount !== 0;
}

async function updateAcceptTimeInDB(id: number) {
  let result = await database.query(
    /*sql*/ `
UPDATE friend_request
SET accept_time = CURRENT_TIMESTAMP
WHERE id = $1
`,
    [id]
  );
  // console.log(result);
}

async function updateRejectTimeInDB(id: number) {
  let result = await database.query(
    /*sql*/ `
UPDATE friend_request
SET reject_time = CURRENT_TIMESTAMP
WHERE id = $1
`,
    [id]
  );
  // console.log(result);
}
