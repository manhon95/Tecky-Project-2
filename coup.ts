import { Request, Response } from "express";
import path from "path";
import { inMatch } from "./utils/matchDb";

export function sendCoupPage(req: Request, res: Response) {
  if (
    !req.query.game ||
    typeof req.query.game !== "string" ||
    !req.session.user?.id
  ) {
    res.status(400);
    res.send("Bad request"); //TODO
  } else if (!inMatch(req.session.user?.id, req.query.game)) {
    res.status(400);
    res.send("You are not in this game"); //TODO
  } else {
    res.sendFile(path.resolve("protected", "coup.html"));
  }
}
