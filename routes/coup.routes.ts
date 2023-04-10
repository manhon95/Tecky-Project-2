import { Router } from "express";
import { hasLogin } from "../guard";
import { sendCoupPage } from "../coup";

export const coupRoutes = Router();

coupRoutes.get("/user/coup", hasLogin, sendCoupPage);
