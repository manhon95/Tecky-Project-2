import "../middleware";
import { Request, Response, Router } from "express";
import { saveUserDetails } from "../register";
import path from "path";

export const registerRoutes = Router();

registerRoutes.get("/register", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "register.html"));
});

registerRoutes.post("/register", saveUserDetails);
