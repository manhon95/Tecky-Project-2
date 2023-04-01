import express, { Router } from "express";
import {
  getProfileFromDB,
  getProfilePic,
  getUsernameFromDB,
} from "../utils/user";
import fs from "fs";
import formidable from "formidable";
import { hasLogin } from "../guard";
import dayjs from "dayjs";

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

commonRoutes.get("/profilePic", async (req, res) => {
  if (req.session.user) {
    let ProfilePic = await getProfilePic(req.session.user.id);
    res.json(ProfilePic.rows[0].profilepic);
  }
});

commonRoutes.get("/username", hasLogin, async (req, res) => {
  // console.log("having get role req")
  if (req.session.user) {
    let username = await getUsernameFromDB(req.session.user.id);
    res.json({
      username,
    });
  }
});

commonRoutes.get("/user-id", hasLogin, async (req, res) => {
  let id = req.session.user?.id;
  if (id === undefined) {
    res.json({ error: "id not exist" });
    return;
  }
  res.json({ id });
});

commonRoutes.get("/profiles/:id", async (req, res) => {
  const userId = +req.params.id;
  let result = await getProfileFromDB(userId);
  result.birthday = dayjs(result.birthday).format("DD/MM/YYYY");
  // console.log(result);
  // change the date format

  res.json(result);
});
