import { Request, Response, Router } from "express";
import { Client } from "pg";
import dotenv from "dotenv";
import "./session-middleWare";


export let loginRouter = Router();
dotenv.config();

export async function passwordChecker(req: Request, res: Response) {
  let email: string = req.body.email;
  let users = await getDetail(email);
  let password: string = req.body.password;
  let status = false;
  let id = users[0]?.id
  let firstName = users[0]?.user_name
    if (users[0]?.email == email && users[0].password == password) {
      status = true;
  }
  if (status) {
        req.session.user = { id: id, firstName: firstName};
    req.session.save();
    res.json({});
  } else {
    res.status(403);
    res.json({ error: "invalid Username or Passsword" });
  }
}

async function getDetail(email: string) {
  const client = new Client({
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });

  await client.connect();
  let userDetails = await client.query(
    'select id, email, user_name, password from "user" where email=($1)',[email]
  );
  await client.end();
  return userDetails.rows;
}
