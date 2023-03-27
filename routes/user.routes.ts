import "../session-middleware";
import { getString, HttpError } from "../utils/express";
import express, { Request, Router } from "express";
import { getSessionUser, hasLogin, isLoggedIn } from "../guard";
import { login } from "../LoginAuthenticate";

export let userRoutes = Router();

export type User = {
  id: number;
  username: string;
  password: string;
  elo: number;
};

userRoutes.post("/login", login);

userRoutes.get("/username", hasLogin, (req, res) => {
  // console.log("having get role req")
  let username = req.session.user?.username;
  res.json({
    username,
  });
});
