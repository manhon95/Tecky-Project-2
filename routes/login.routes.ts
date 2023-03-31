import "../middleware";
import { Request, Response, Router } from "express";
import { googleLogin, login } from "../login";
import database from "../db";
import path from "path";

export const loginRoutes = Router();

loginRoutes.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login.html"));
});

loginRoutes.post("/login/password", login);

//use google to log in
loginRoutes.get("/login/google", googleLogin);
