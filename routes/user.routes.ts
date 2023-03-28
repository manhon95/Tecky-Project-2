import "../session-middleware";
import { getString, HttpError } from "../utils/express";
import express, { Request, Router } from "express";
import { getSessionUser, hasLogin, isLoggedIn } from "../guard";
import { login } from "../LoginAuthenticate";
import { client } from "../db";
import dayjs from "dayjs";

export let userRoutes = Router();

export type User = {
  id: number;
  username: string;
  password: string;
  elo: number;
};

userRoutes.post("/login", login);

userRoutes.get("/username", hasLogin, async (req, res) => {
  // console.log("having get role req")
  let username = await getUsernameFromDB(req.session.user?.id);
  res.json({
    username,
  });
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

// change username
userRoutes.patch("/usernames/:id", async (req, res) => {
  let newName = req.body.newName;
  let id = req.params.id;
  // check duplicate
  console.log("before check duplicate");
  let result = await client.query(
    /* sql */ `
select user_name from "user" where user_name = $1
`,
    [newName]
  );
  let row = result.rows[0];
  if (!row) {
    // if no existing same name
    await client.query(
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

async function getInfoFromDB(id: number | undefined) {
  if (id === undefined) return "error, id not exist";
  let result = await client.query(
    /*sql*/ `
select id, user_name, birthday, elo from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0];
}

async function getUsernameFromDB(id: number | undefined) {
  if (id === undefined) return "error, id not exist";
  let result = await client.query(
    /*sql*/ `
select user_name from "user" where id= $1
  `,
    [id]
  );
  return result.rows[0].user_name;
}
