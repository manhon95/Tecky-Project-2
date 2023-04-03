import express, { Router } from "express";
import path from "path";
import { hasLogin } from "../guard";
import {
  getUserActiveBadge,
  getUserBadges,
  patchUserActiveBadge,
  patchUsername,
  upLoadProfilePicture,
} from "../profile";

export const profileRoutes = Router();

profileRoutes.get("/user/profile", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "profile.html"));
});

// change username
profileRoutes.patch("/usernames/:id", patchUsername);

profileRoutes.put("/ProfilePic", upLoadProfilePicture);

profileRoutes.use("/profilePic", express.static("/profilePicture"));

profileRoutes.get(`/users/:userId/badges`, getUserBadges);

profileRoutes.get(`/users/:userId/activeBadge`, getUserActiveBadge);

profileRoutes.patch(
  "/users/:userId/activeBadge/:badgeId",
  patchUserActiveBadge
);
