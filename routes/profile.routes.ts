import express, { Router } from "express";
import path from "path";
import { hasLogin } from "../guard";
import { getProfilePicture, patchUsername, upLoadProfilePicture } from "../profile";

export const profileRoutes = Router();

profileRoutes.get("/user/profile", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "profile.html"));
});

// change username
profileRoutes.patch("/usernames/:id", patchUsername);

profileRoutes.put("/ProfilePic", upLoadProfilePicture);

profileRoutes.use("/profilePic", express.static("/profilePicture"));

