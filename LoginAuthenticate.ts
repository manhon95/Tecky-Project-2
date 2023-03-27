import { Request, Response, Router } from "express";
import dotenv from "dotenv";
import "./session-middleware";
import { client } from "./db";

export let loginRouter = Router();
dotenv.config();

export async function login(req: Request, res: Response) {
  let email: string = req.body.email;
  let users = await getDetail(email);
  let password: string = req.body.password;
  let status = false;
  let id = users[0]?.id;
  let username = users[0]?.user_name;
  if (users[0]?.email == email && users[0].password == password) {
    status = true;
  }
  if (status) {
    req.session.user = { id, username };
    req.session.save();
    res.json({});
  } else {
    res.status(403);
    res.json({ error: "invalid Username or Passsword" });
  }
}

async function getDetail(email: string) {
  let userDetails = await client.query(
    'select id, email, user_name, password from "user" where email=($1)',
    [email]
  );

  return userDetails.rows;
}
