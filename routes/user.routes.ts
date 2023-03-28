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

userRoutes.get("/username", hasLogin, (req, res) => {
  // console.log("having get role req")
  let username = req.session.user?.username;
  res.json({
    username,
  });
});

userRoutes.get("/profile", async (req, res) => {
  let result = await getInfoFromDB(req.session.user?.id);
  result.birthday = dayjs(result.birthday).format("DD/MM/YYYY");
  // console.log(result);
  // change the date format

  res.json(result);
});

async function getInfoFromDB(id: number | undefined) {
  if (id === undefined) return "error, id not exist";
  let result = await client.query(
    /*sql*/ `
select id, user_name, birthday, elo from public.user where id= $1
  `,
    [id]
  );
  return result.rows[0];
}
