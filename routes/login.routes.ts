import "../middleware";
import { Request, Response, Router } from "express";
import { login } from "../login";
import database from "../db";
import path from "path";

export const loginRoutes = Router();

loginRoutes.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login.html"));
});

loginRoutes.post("/login/password", login);

//use google to log in
loginRoutes.get("/login/google", async (req, res, next) => {
  try {
    let accessToken = req.session?.grant?.response?.access_token;
    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        method: "get",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    let googleJson = await googleRes.json();
    let resultDB = await database.query(
      'select id, user_name, profilePic from "user" where email =($1)',
      [googleJson.email]
    );
    let user = resultDB.rows[0];
    if (user) {
      //if existing user
      req.session.user = {
        id: user.id,
        username: user.user_name || googleJson.name,
        profilePic: user.profilepic,
      };
      req.session.save();
      console.log(req.session.user);
      res.redirect("/user/lobby");
      return;
    }

    //if user not exist in database, create user

    await database.query(
      `insert into "user" (user_name, email, elo, profilePic, coins) values ($1, $2, '1000', $3, 100)`,
      [googleJson.name, googleJson.email, googleJson.picture]
    );
    let id = await database.query(
      'select id, user_name from "user" where email =($1)',
      [googleJson.email]
    );

    console.log(
      "profilepic from user.route create user save session",
      googleJson.picture
    );
    req.session.user = {
      id: id.rows[0].id,
      username: googleJson.name,
      profilePic: googleJson.picture,
    };
    req.session.save();
    res.redirect("/user/lobby");
  } catch (error) {
    next(error);
  }
});
