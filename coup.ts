import { Request, Response } from "express";
import { inMatch } from "./utils/matchDb";
import { getGameById } from "./coupList";
import { logger } from "./logger";
import path from "path";

const filename = path.basename(__filename);

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
  } else if (getGameById(req.query.game)) {
    logger.debug(`${filename} - req.query.game: ${req.query.game}`);
    res.sendFile(path.resolve("protected", "coup.html"));
    // res.sendFile(path.resolve("protected", `coup.html?game=${req.query.game}`));
  } else {
    logger.debug(`${filename} - no game found`);
    res.status(400);
    res.send("Bad request"); //TODO
  }
}
