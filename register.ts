import { Request, Response } from "express";
import dotenv from "dotenv";
import database from "./db";
import "./middleware";
import { hashPassword } from "./hash";
import nodemailer from "nodemailer";
import { env } from "./env";
dotenv.config();

//------------------insert type------- 5:30-------
export async function saveUserDetails(req: Request, res: Response) {
  let checkStatus = true;
  const emailFromDB = await database.query(
    /* sql */ 'select email from "user" where email=($1)',
    [req.body.email]
  );
  const elo = 1000;
  const coins = 100;
  const userName: string = req.body.userName;
  // let birthday2 = req.body.monthOfBirth + "/" + req.body.yearOfBirth;
  const birthday = new Date();
  birthday.setFullYear(req.body.yearOfBirth, req.body.monthOfBirth - 1, 1);
  birthday.setHours(0, 0, 0, 0);
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  const report = {};

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
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
      user: `${env.NODEMAILER_EMAIL}`, // generated ethereal user
      pass:`${env.NODEMAILER_PW}`, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `${env.NODEMAILER_EMAIL}`, // sender address
    to: `${email}`, // list of receivers
    subject: "verification ", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
//This function get info from http request and save as use detail

  //0------------------add isVerified--------------

  if (checkStatus) {
    const newPassword = await hashPassword(password);
    //save email, userName, password,elo into database
    await database.query(
      /* sql */ `insert into "user" (email, user_name, password, birthday, elo, coins, profilepic) 
      values ($1,$2,$3,$4,$5,$6,'default_profilePic.jpg')`,
      [email, userName, newPassword, birthday, elo, coins]
      );
    const id = await database.query(
      `select id from "user" where user_name=($1)`,
      [userName]
    );
    report["success"] = "success";
    req.session.user = {
      id: id.rows[0].id,
      username: userName,
      profilePic: null,
    };
    req.session.save();
  } else {
    res.status(400);
  }
  res.json(report);
}
