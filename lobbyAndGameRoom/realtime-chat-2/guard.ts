import { NextFunction, Request, Response } from "express";
import { HttpError } from "./utils/express";

export function hasLogin(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    next()
  } else {
    res.end('unauthorized');
  }
}

export function getSessionUser(req: Request) {
  let user = req.session.user
  if (user) return user
  throw new HttpError(401, 'This API is only for authenticated users')
}
