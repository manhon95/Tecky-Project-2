import "../middleware";
import { getString, HttpError } from "../utils/express";
import express, { Request, Response, Router } from "express";
import { getSessionUser, hasLogin } from "../guard";
import { login } from "../login";
import database from "../db";
import dayjs from "dayjs";
import { send } from "process";
import session from "express-session";
import formidable from "formidable";
import fs from "fs";
import { saveUserDetails } from "../register";
import path from "path";

export const userRoutes = Router();

export type User = {
  id: string;
  username: string;
  password: string;
  elo: number;
};

userRoutes.use("/user", hasLogin, express.static("protected"));

userRoutes.post("/register", (req: Request, res: Response) => {
  saveUserDetails(req, res);
});

//Log out function
userRoutes.post("/login/logout", (req, res) => {
  if (req.session.user) {
    req.session.user.id = "";
    req.session.user.username = "";
    req.session.save();
    res.end();
  }
});

const uploadDir = "profilePicture";
fs.mkdirSync(uploadDir, { recursive: true });
const form = formidable({
  uploadDir,
  keepExtensions: true,
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});

userRoutes.put("/ProfilePic/:id", async (req, res) => {
  let id = req.params.id;
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.status(507);
      res.json({ err: "fail to up load image", detail: String(err) });
      return;
    }
    let profilePic = files.profilePic;

    let image = Array.isArray(profilePic) ? profilePic[0] : profilePic;
    console.log(image.newFilename);
    res.json(image.newFilename);
  });
});

async function getProfilePic(id: string) {
  let result = await database.query(
    /*sql*/ `
select profilepic from "user" where id = ($1)
`,
    [id]
  );
  return result;
}

async function getCoinsFromDB(userId: number) {
  let result = await database.query(
    /*sql*/ `
select coins from "user" where id = ($1)
`,
    [userId]
  );
  return result.rows[0];
}
