import { Router } from "express";

import { getUnboughtBadges, getUserCoins } from "../shop";

export const shopRoutes = Router();

// Return badge link when asked
shopRoutes.get("/unboughtBadges/:id", getUnboughtBadges);

shopRoutes.get("/coins/:id", getUserCoins);
