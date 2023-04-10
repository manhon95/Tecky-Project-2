import nodemailer from "nodemailer";
import { env } from "../env";

export async function sendEmailVerificationCode(email: String) {
  //-----------------------here insert send email content--------
  const verificationCode = Math.random().toString(36).slice(7);
  const transporter = nodemailer.createTransport({
    service: "outlook",
    auth: {
      user: `${env.NODEMAILER_EMAIL}`, // generated ethereal user
      pass: `${env.NODEMAILER_PW}`, // generated ethereal password
    },
  });
  // send mail with defined transport object
  await transporter.sendMail({
    from: `${env.NODEMAILER_EMAIL}`, // sender address
    to: `${email}`, // list of receivers
    subject: "verification ", // Subject line
    text: "Hello world?", // plain text body
    html: `<b>enter your code: ${verificationCode}</b>`, // html body
  });
  return verificationCode;
}
