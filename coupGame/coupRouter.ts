import { Router, Request, Response } from "express";
import path from "path";

export const coupRouter = Router();

coupRouter.get("/test", (req: Request, res: Response) => {
  res.sendFile(path.resolve("Public", "testgameroom.html"));
});

coupRouter.get("/coup", (req: Request, res: Response) => {
  res.sendFile(path.resolve("Public", "coup-game.html"));
});
