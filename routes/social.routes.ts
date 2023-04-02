import { Router } from "express";
import path from "path";
import { hasLogin } from "../guard";
import {
  acceptFriendRequest,
  deleteFriend,
  getAllFriends,
  getFriendRequest,
  rejectFriendRequest,
} from "../social";

export const socialRoutes = Router();

socialRoutes.get("/user/social", hasLogin, (req, res) => {
  res.sendFile(path.resolve("protected", "social.html"));
});

// getting all the friends from user
socialRoutes.get("/users/:id/friends", getAllFriends);

// delete friends from the user
socialRoutes.delete("/users/:idA/friends/:idB", deleteFriend);

// getting all the friend request sent to user
socialRoutes.get("/users/:id/requests", getFriendRequest);

// when user accept friend request update the accept time
socialRoutes.put("/friend-requests/:id/accept", acceptFriendRequest);

// user reject the friend request
socialRoutes.put("/friend-requests/:id/reject", rejectFriendRequest);
