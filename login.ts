import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import "./middleware";
import database from "./db";
import { checkPassword } from "./hash";

dotenv.config();

/* --------------------------- login with password -------------------------- */
export async function login(req: Request, res: Response) {
  const email: string = req.body.email;
  const password: string = req.body.password;
  const result = await database.query(
    'select id, email, profilePic, user_name, password from "user" where email=($1);',
    [email]
  );

  const users = result.rows[0];

  if (users !== undefined && (await checkPassword(password, users.password))) {
    //password match
    req.session.user = {
      id: String(users.id),
      username: users.user_name,
      profilePic: users.profilePic,
    };
    req.session.save();
    res.json({}); // no error return
  } else {
    //password not match
    res.status(403);
    res.json({ error: "invalid Username or Password" });
  }
}

/* ---------------------------- login with google --------------------------- */
export async function googleLogin(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
}
