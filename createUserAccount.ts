import { Request, Response } from "express";
import dotenv from "dotenv";
import { client } from "./db";
import "./session-middleware";
import { hashPassword } from "./hash";
import crypto from "crypto"
// import sgMail = from "@sendgrid/mail"
dotenv.config();



//------------------insert type------- 5:30-------


//This function get info from http request and save as use detail
export async function saveUserDetails(req: Request, res: Response) {
  let checkStatus = true;
  let emailFromDB = await client.query(
    /* sql */ 'select email from "user" where email=($1)',
    [req.body.email]
  );
  let elo = 1000;
  let userName: string = req.body.userName;
  // let birthday2 = req.body.monthOfBirth + "/" + req.body.yearOfBirth;
  let birthday = new Date();
  birthday.setFullYear(req.body.yearOfBirth, req.body.monthOfBirth - 1, 1);
  birthday.setHours(0, 0, 0, 0);
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword;
  let emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let report = {};

  //check password and email formate when registering
  if (password.length < 8) {
    res.status(400);
    report["passwordLength-password"] = "Password must be 8 or more character*";
    checkStatus = false;
  } else {
    report["passwordLength-password"] = "";
  }

  if (password != confirmPassword) {
    report["pwCheck-password"] = "Confirm password is different*";
    checkStatus = false;
  } else {
    report["pwCheck-password"] = "";
  }

  if (password == confirmPassword && password.length > 7) {
    report["password"] = true;
  } else {
    report["password"] = false;
  }

  if (!email.match(emailFormat)) {
    report["Format-email"] = "invalid Email*";
    checkStatus = false;
  } else {
    report["Format-email"] = "";
  }

  if (emailFromDB.rows[0] == undefined) {
    report["duplicate-email"] = "";
  } else {
    report["duplicate-email"] = "Email already used*";
    checkStatus = false;
  }
  if (emailFromDB.rows[0] == undefined && email.match(emailFormat)) {
    report["email"] = true;
  } else {
    report["email"] = false;
  }




//-----------------------here insert send email content--------









//0------------------add isVerified--------------


  if (checkStatus) {
    let newPassword = await hashPassword(password);
    //save email, userName, password,elo into database
    await client.query(
      /* sql */ `insert into "user" (email, user_name, password, birthday, elo) 
    values ($1,$2,$3,$4,$5)`,
      [email, userName, newPassword, birthday, elo]
    );
    let id = await client.query(`select id from "user" where user_name=($1)`,[userName]);
    report["success"] = "success";
    req.session.user = { id: id.rows[0].id, username: userName };
    req.session.save();
    res.json(report);
  } else {
    res.status(400);
    res.json(report);
  }
}