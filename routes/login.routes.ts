import express, { Request, Response, Router } from "express";
import { googleLogin, login } from "../login";
import path from "path";
import { hasLogin } from "../guard";

export const loginRoutes = Router();

loginRoutes.post("/login/password", login);

//use google to log in
loginRoutes.get("/login/google", googleLogin);

loginRoutes.use("/user", hasLogin, express.static("protected"));

loginRoutes.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login.html"));
});
