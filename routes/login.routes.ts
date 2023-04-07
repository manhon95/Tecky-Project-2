import express, { Request, Response, Router } from "express";
import { googleLogin, login } from "../login";
import path from "path";
import { hasLogin } from "../guard";
import { changeNewPassword, checkEmail, submitVerifyCode } from "../forgetPassword";

export const loginRoutes = Router();

loginRoutes.post("/login/password", login);


//use google to log in
loginRoutes.get("/login/google", googleLogin);

loginRoutes.use("/user", hasLogin, express.static("protected"));

loginRoutes.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login.html"));
});

loginRoutes.post("/forgetPasswordEmail", checkEmail)

loginRoutes.post("/forgetPasswordVerify", submitVerifyCode)

loginRoutes.post("/changeForgetPassword", changeNewPassword);
