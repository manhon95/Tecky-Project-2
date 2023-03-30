import session from "express-session";
import { GrantSession } from "grant";

export let sessionMiddleware = session({
  secret:
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2),
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60, // 1hr
  },
});

declare module "express-session" {
  interface SessionData {
    user: {
      id: string;
      username: string;
      profilePic: string|null
    };
    grant?: GrantSession
  }
}
