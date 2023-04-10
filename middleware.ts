import session from "express-session";
import express, { Express } from "express";
import { GrantSession } from "grant";

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      username: string;
      profilePic: string | null;
    };
    email: string | null;
    verificationCode: String;
    grant?: GrantSession;
  }
}

export const sessionMiddleware = session({
  secret:
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2),
  resave: false,
  saveUninitialized: false,
});

export function addMiddleware(app: Express) {
  app.use(express.static("public"));

  app.use(express.urlencoded());
  app.use(express.json());

  app.use(sessionMiddleware);
}
