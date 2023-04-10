import "../middleware";
import { Request, Response, Router } from "express";
import { verify } from "../verify";
import path from "path";

export const verifyRoutes = Router();
verifyRoutes.get("/verify", (req: Request, res: Response) => {
    res.sendFile(path.resolve("public", "verify.html"))})

verifyRoutes.post("/verify", verify)

