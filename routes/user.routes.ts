import "../middleware";
import { getString, HttpError } from "../utils/express";
import express, { Request, Response, Router } from "express";
import { getSessionUser, hasLogin, isLoggedIn } from "../guard";
import { login } from "../login";
import database from "../db";
import dayjs from "dayjs";
import { send } from "process";
import session from "express-session";
import formidable from "formidable";
import fs from "fs";
import { saveUserDetails } from "../register";
import path from "path";

export let userRoutes = Router();

export type User = {
  id: string;
  username: string;
  password: string;
  elo: number;
};

userRoutes.use("/user", isLoggedIn, express.static("protected"));

userRoutes.post("/register", (req: Request, res: Response) => {
  saveUserDetails(req, res);
});

//Log out function
userRoutes.post("/login/logout", (req, res) => {
  if (req.session.user) {
    req.session.user.id = "";
    req.session.user.username = "";
    req.session.save();
    res.end();
  }
});

const uploadDir = "profilePicture";
fs.mkdirSync(uploadDir, { recursive: true });
const form = formidable({
  uploadDir,
  keepExtensions: true,
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});

userRoutes.put("/ProfilePic/:id", async (req, res) => {
  let id = req.params.id;
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(507);
      res.json({ err: "fail to up load image", detail: String(err) });
      return;
    }
    let profilePic = files.profilePic;

    let image = Array.isArray(profilePic) ? profilePic[0] : profilePic;
    console.log(image.newFilename);
    res.json(image.newFilename);
  });
});

userRoutes.use("/profilePic", express.static(uploadDir));

userRoutes.get("/profilePic", async (req, res) => {
  if (req.session.user) {
    let ProfilePic = await getProfilePic(req.session.user.id);
    res.json(ProfilePic.rows[0].profilepic);
  }
});

userRoutes.get("/username", hasLogin, async (req, res) => {
  // console.log("having get role req")
  if (req.session.user) {
    let username = await getUsernameFromDB(req.session.user.id);
    res.json({
      username,
    });
  }
});

// return user-id stored in the session data(back-end)
userRoutes.get("/user-id", hasLogin, async (req, res) => {
  let id = req.session.user?.id;
  if (id === undefined) {
    res.json({ error: "id not exist" });
    return;
  }
  res.json({ id });
});

// Restful API profile handler
userRoutes.get("/profiles/:id", async (req, res) => {
  const userId = +req.params.id;
  let result = await getInfoFromDB(userId);
  result.birthday = dayjs(result.birthday).format("DD/MM/YYYY");
  // console.log(result);
  // change the date format

  res.json(result);
});

// Get user coins
userRoutes.get("/coins/:userId", async (req, res) => {
  let userId = +req.params.userId;
  let coins = await getCoinsFromDB(userId);

  res.json(coins);
});

// change username
userRoutes.patch("/usernames/:id", async (req, res) => {
  let newName = req.body.newName;
  let id = req.params.id;
  // check duplicate
  // console.log("before check duplicate");
  let result = await database.query(
    /* sql */ `
select user_name from "user" where user_name = $1
`,
    [newName]
  );
  let row = result.rows[0];
  if (!row) {
    // if no existing same name
    await database.query(
      /*sql*/ `
update "user" set user_name = $1 where id = ${id}
    `,
      [newName]
    );
    res.json({ success: true });
    return;
  }
  res.json({ success: false });
});

// getting all the friends from user
userRoutes.get("/users/:id/friends", async (req, res) => {
  let userId = +req.params.id;
  let friends = await getFriendsFromDB(userId);

  res.json({ friends });
});

// delete friends from the user
userRoutes.delete("/users/:idA/friends/:idB", async (req, res) => {
  let userAId = +req.params.idA;
  let userBId = +req.params.idB;
  // console.log(`trying to delete ${userAId}, ${userBId}`);
  let success = await deleteFriendFromDB(userAId, userBId);
  // console.log("trying to delete " + success);
  res.json({ success });
});

// getting all the friend request sent to user
userRoutes.get("/users/:id/requests", async (req, res) => {
  let userId = +req.params.id;
  let requests = await getFriendRequestFromDB(userId);
  res.json({ requests });
});

// when user accept friend request update the accept time
userRoutes.put("/friend-requests/:id/accept", async (req, res) => {
  let requestId = +req.params.id;
  // console.log(`request id: ${requestId}`);
  await acceptFriendRequest(requestId);
  res.json({});
});

// user reject the friend request
userRoutes.put("/friend-requests/:id/reject", async (req, res) => {
  // console.log("received reject!");
  let requestId = +req.params.id;

  await rejectFriendRequest(requestId);
  res.json({});
});

// post a friend request from user
userRoutes.post(
  "/friend-requests/:sender_id/:receiver_id",
  async (req, res) => {
    let senderId = +req.params.sender_id;
    let receiverId = +req.params.receiver_id;
    if (senderId === receiverId) {
      res.json({ success: false });
      return;
    }
    postFriendRequest(senderId, receiverId);
    // console.log(`${senderId} trying to add ${receiverId}`);
    res.json({ success: true });
  }
);

// are db handling method
async function getInfoFromDB(id: number | undefined) {
  if (id === undefined) return "error, id not exist";
  let result = await database.query(
    /*sql*/ `
select id, user_name, birthday, elo from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0];
}

async function getUsernameFromDB(id: string | null) {
  if (id === undefined) return "error, id not exist";
  let result = await database.query(
    /*sql*/ `
select user_name from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0].user_name;
}

async function getFriendsFromDB(id: number | undefined) {
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

async function getFriendRequestFromDB(id: number) {
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

async function acceptFriendRequest(id: number) {
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

async function rejectFriendRequest(id: number) {
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

async function postFriendRequest(senderId: number, receiverId: number) {
  let result = await database.query(
    /*sql*/ `
insert into "friend_request" (sender_id, receiver_id, message)
values ($1, $2, 'default message');
`,
    [senderId, receiverId]
  );
}

async function getProfilePic(id: string) {
  let result = await database.query(
    /*sql*/ `
select profilepic from "user" where id = ($1)
`,
    [id]
  );
  return result;
}

async function getCoinsFromDB(userId: number) {
  let result = await database.query(
    /*sql*/ `
select coins from "user" where id = ($1)
`,
    [userId]
  );
  return result.rows[0];
}
