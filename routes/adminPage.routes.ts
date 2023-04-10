import express, { Request, Response, Router } from "express";
import path from "path";
import { isAdmin } from "../guard";
import { changCoinsAmount, findAccount, verification } from "../adminFile/adminPage";

export const admin = Router();

admin.use("/admin", isAdmin, express.static("adminFile"));

admin.get("/admin", (req: Request, res: Response) => {
    res.sendFile(path.resolve("adminFile", "adminPage.html"));
  });
  
admin.post("/searchUserForm", findAccount)
admin.post("/changeCoinsAmountForm", changCoinsAmount)
admin.post("/verificationForm", verification)
