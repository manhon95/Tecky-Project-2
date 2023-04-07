import { Request, Response } from "express";
import "./middleware";
import database from "./db";

export async function verify(req: Request, res: Response) {
  if (req.body.code == req.session.verificationCode) {
    await database.query(
      `update "user" set  email_verify = true where id =($1)`,
      [req.session.user?.id]
    );

    req.session.save();
    res.json({ message: true });
  } else {
    res.json({ message: "verification code invalid" });
  }
}
