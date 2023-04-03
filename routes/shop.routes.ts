import { Router } from "express";

import { getUnboughtBadges, getUserCoins, postBadgeOwner } from "../shop";

export const shopRoutes = Router();

// Return badge link when asked
shopRoutes.get("/unboughtBadges/:id", getUnboughtBadges);

shopRoutes.get("/coins/:id", getUserCoins);

// shopRoutes.post("/users/:userId/badges/:badgeId", async (req, res, next) => {
//   try {
//     await postBadgeOwner(req, res);
//   } catch (error) {
//     return next(error);
//   }
// });

shopRoutes.post("/users/:userId/badges/:badgeId", async (req, res, next) => {
  try {
    await postBadgeOwner(req, res);
  } catch (error) {
    return next(error);
  }
});
