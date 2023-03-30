import { Request, Response, Router } from "express";
import dotenv from "dotenv";
import "./session-middleware";
import { client } from "./db";
import { checkPassword } from "./hash";

export let loginRouter = Router();
dotenv.config();

export async function login(req: Request, res: Response) {
  let email: string = req.body.email;
  let users = await getDetail(email);
  let password: string = req.body.password;
  let profilePic: string = users[0]?.profilepic;
  let status = false;
  let id = users[0]?.id;
  let username = users[0]?.user_name;
  if (
    users[0]?.email == email &&
    (await checkPassword(password, users[0].password))
  ) {
    status = true;
  }

  //remember me button
  if (status) {
    console.log("profilepicfrom loginAuthentic", profilePic)
    req.session.user = { id, username, profilePic};
    req.session.save();
    res.json({});
  } else {
    res.status(403);
    res.json({ error: "invalid Username or Passsword" });
  }
}

export async function getDetail(email: string) {
  let userDetails = await client.query(
    'select id, email, profilePic user_name, password from "user" where email=($1)',
    [email]
  );

  return userDetails.rows;
}
