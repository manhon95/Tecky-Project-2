import { NextFunction, Request, Response } from "express";
import { HttpError } from "./utils/express";
import "./middleware";
import database from "./db";


export async function hasLogin(req: Request, res: Response, next: NextFunction) {
  const verify = await database.query(
    `select email_verify from "user" where id =($1)`,
    [req.session.user?.id]
  );
console.log("session check: ",verify.rows[0].email_verify)
  if (req.session.user?.id&&verify.rows[0].email_verify) {
    next();
  } else {
    res.end("unauthorized");
    // next()
  }
}

export function checkLoginToLobby(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.session.user?.id) {
    res.redirect("/user/lobby");
  } else {
    // res.end("unauthorized");
    next();
  }
}

export function getSessionUser(req: Request) {
  let user = req.session.user;
  if (user) return user;
  // else {
  //   user = { id: 0, username: "dev" }
  //   return user
  // }
  throw new HttpError(401, "This API is only for authenticated users");
}
