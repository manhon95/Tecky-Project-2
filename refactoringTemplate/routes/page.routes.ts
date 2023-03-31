import { Router } from "express";
import path from "path";
import { sampleFunction1, sampleFunction2 } from "../pageMain";

export const pageRoutes = Router();

pageRoutes.get("/page", (req, res) => {
  res.sendFile(path.resolve("PublicOrProtected", "page.html"));
});

pageRoutes.get("/page/something1", (req, res) => {
  sampleFunction1;
});

pageRoutes.get("/page/something2", (req, res) => {
  sampleFunction2;
});
