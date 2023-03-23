import { NextFunction, Request, Response } from "express";

export function hasLogin(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    next()
  } else {
    res.end('unauthorized');
  }
}