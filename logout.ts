import "./middleware";
import { Request, Response } from "express";

export function logOutClearSession(req: Request, res: Response) {
    req.session.user= {
        id: "",
        username: "",
        profilePic: "",
      };
      req.session.save();
    res.end();
  }

