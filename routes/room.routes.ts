import "../middleware";
import { Router } from "express";
import { hasLogin } from "../guard";
import path from "path";
import { checkFriends, postFriendRequest } from "../room";

export const roomRoutes = Router();

roomRoutes.get("/user/room", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "room.html"));
});

// handling check if player are friends
roomRoutes.get("/friends/:userId1/:userId2", checkFriends);

// post a friend request when user clicked add button in the page
roomRoutes.post("/friend-requests/:sender_id/:receiver_id", postFriendRequest);
