import express, { Router } from "express";
import {
  getProfile,
  getProfilePic,
  getSessionUserId,
  getUsername,
} from "../utils/user";
import fs from "fs";
import formidable from "formidable";
import { hasLogin } from "../guard";

// This is for routes using in more than one pages(don't know how to classify put them in here first)

export const commonRoutes = Router();

const uploadDir = "profilePicture";
fs.mkdirSync(uploadDir, { recursive: true });
const form = formidable({
  uploadDir,
  keepExtensions: true,
  filter: (part) => part.mimetype?.startsWith("image/") || false,
});

/* ----------------------------- Start of route ----------------------------- */
commonRoutes.use("/profilePic", express.static(uploadDir));

commonRoutes.get("/usernames/:id", hasLogin, getUsername);

commonRoutes.get("/user-id", hasLogin, getSessionUserId);

commonRoutes.get("/profiles/:id", getProfile);

//Log out function
commonRoutes.post("/login/logout", (req, res) => {
  if (req.session.user) {
    req.session.user.id = "";
    req.session.user.username = "";
    req.session.save();
    res.end();
  }
});

commonRoutes.get("/profilePic", async (req, res) => {
  if (req.session.user) {
    let ProfilePic = await getProfilePic(req.session.user.id);
    res.json(ProfilePic.rows[0].profilepic);
  }
});
