import { Request, Response } from "express";
import jsonfile from "jsonfile";

let users = jsonfile.readFileSync("userDetail.json");

export function passwordChecker(req: Request, res: Response) {
  let email: string = req.body.email;
  let password: string = req.body.password;
  let status = false;

  for (let user of users) {
    if (user.email == email && user.password == password) {
      status = true;
      break;
    }
  }

  if (status) {
    res.redirect("gameroom.html");
    res.json()
    // req.session.email = req.body.email
    // req.session.save()
  } else {
    res.status(403); 
    res.json({ "error": "invalid Username or Passsword" })
  }
}
