import { NextFunction, Request, Response } from "express";
import { HttpError } from "../../utils/express";

export function hasLogin(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    next()
  } else {
    res.end('unauthorized');
    // next()
  }
}

export function getSessionUser(req: Request) {
  let user = req.session.user
  if (user) return user
  // else {
  //   user = { id: 0, username: "dev" }
  //   return user
  // }
  throw new HttpError(401, 'This API is only for authenticated users')
}
