import { Request, Response } from "express";
import jsonfile from "jsonfile";

let users: User[] = jsonfile.readFileSync("userDetail.json");
type User = {
  Title: string;
  firstName: string;
  lastName: string;
  monthOfBirth: number;
  yearOfBirth: number;
  email: string;
  password: string;
};

//This function get info from http request and save as use detail
export async function saveUserDetails(req: Request, res: Response) {
  let checkStatus = true;
  let Title = req.body.Title;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let monthOfBirth = req.body.monthOfBirth;
  let yearOfBirth = req.body.yearOfBirth;
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword
  let emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  if(password!=confirmPassword||password.length<8){
          res.status(400)
          checkStatus = false;
  }

  if(!email.match(emailFormat)){

    res.status(400)
    checkStatus = false;
  }
  for (let user of users) {
      if (user.email == email) {
      res.status(400)
      checkStatus = false;
      break;
    }
  }
  if (checkStatus) {
    users.push({
      Title,
      firstName,
      lastName,
      monthOfBirth,
      yearOfBirth,
      email,
      password
    });
    await jsonfile.writeFile("userDetail.json", users);
    res.end("done");
  } else {
    res.end("not submit");
  }
}

