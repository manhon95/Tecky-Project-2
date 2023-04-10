import express, {Request, Response, Router } from "express";
import {
  getProfile,
  getProfilePic,
  getSessionuserId,
  getUsername,
} from "../utils/user";
import fs from "fs";
import formidable from "formidable";
import { hasLogin } from "../guard";
import { logOutClearSession } from "../logout";
import { getProfilePicture } from "../profile";
import { reportBugs } from "../bugReport";
import jsonfile from "jsonfile"
import path from "path";


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

commonRoutes.get("/user-id", hasLogin, getSessionuserId);

commonRoutes.get("/profiles/:id", getProfile);

//Log out function
commonRoutes.post("/login/logout", logOutClearSession);

commonRoutes.get("/profilePic", getProfilePicture);

commonRoutes.post("/bugReport", async (req: Request ,res: Response)=>{
  let file = await jsonfile.readFile(path.join(__dirname, "../bugReport.json"));
  console.log(file)
  let report = req.body.value
  file.push({report})
  console.log(report)
  jsonfile.writeFileSync(path.join(__dirname, "../bugReport.json"), file);
  res.json({message: "test"})
});
  
