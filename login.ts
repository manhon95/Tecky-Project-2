import { Request, Response } from "express";
import dotenv from "dotenv";
import "./middleware";
import database from "./db";
import { checkPassword } from "./hash";

dotenv.config();

export async function login(req: Request, res: Response) {
  const email: string = req.body.email;
  const password: string = req.body.password;
  const result = await database.query(
    'select id, email, profilePic user_name, password from "user" where email=($1)',
    [email]
  );
  const users = result.rows[0];

  if (users !== undefined && (await checkPassword(password, users.password))) {
    //password match
    req.session.user = {
      id: String(users.id),
      username: users.user_name,
      profilePic: users.profilePic,
    };
    req.session.save();
    res.json({}); // no error return
  } else {
    //password not match
    res.status(403);
    res.json({ error: "invalid Username or Password" });
  }
}
