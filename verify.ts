import { Request, Response } from "express";
import "./middleware";
import database from "./db";

export async function verify(req: Request, res: Response) {
  if (req.body.code == req.session.verificationCode) {
    await database.query(
      `update "user" set  email_verify = true where email =($1)`,
      [req.session.email]
    );
    const result = await database.query(
      `select id, user_name from "user" where email=($1)`,
      [req.session.email]
    );  
     console.log("save session id: "+result.rows[0].id)
    req.session.user = {
   
      id: String(result.rows[0].id),
      username: result.rows[0].user_name,
      profilePic: null,
    }
    req.session.save();
    res.json({ verify: true });
  } else {
    res.json({ message: "verification code invalid" });
  }
}
