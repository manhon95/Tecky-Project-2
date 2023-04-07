import { Request, Response } from "express";
import "./middleware";
import database from "./db";
import { hashPassword } from "./utils/hash";


export async function checkEmail(req: Request, res: Response) {
 try{
  const emailDB = await database.query(
    `select email from "user" where email=($1)`,
    [req.body.email]
  );
if (emailDB.rows[0].email == req.body.email) {
  let verificationCode = "1234"
  // = await sendEmailVerificationCode(result.rows[0].email);
  req.session.verificationCode = verificationCode;
    req.session.email = req.body.email
    req.session.save();
    res.json({ verify: true });
  }

 } catch{
    res.json({ verify: false });
}
}

export async function getPasswordVerifyCode(req: Request, res: Response) {
  let result = await database.query('select email from "user" where email=($1);', [
    req.session.email
  ]);
  let verificationCode = "1234"
  // = await sendEmailVerificationCode(result.rows[0].email);
  req.session.verificationCode = verificationCode;
  res.end();
}


export async function submitVerifyCode(req: Request, res: Response) {
  if (req.session.verificationCode == req.body.code) {
    res.json({ pass: true });
  } else {
    res.json({ message: "invalid code", pass: false });
  }
}


export async function changeNewPassword(req: Request, res: Response) {
  let password = req.body.password;
  let ConfirmPassword = req.body.ConfirmPassword;
  console.log(req.session.email)
  if (password == ConfirmPassword) {
    const hasdedPassword = await hashPassword(password);
    database.query(
      `update "user" set password = '${hasdedPassword}' where email = '${req.session.email}'`
    );
    res.json({ message: "set new password success" });
  } 
}
