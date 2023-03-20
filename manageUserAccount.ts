import { Request, Response } from "express";
import jsonfile from "jsonfile";

let users: User[] = jsonfile.readFileSync("userDetail.json");
type User = {
  title: string;
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
  let title = req.body.title;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let monthOfBirth = req.body.monthOfBirth;
  let yearOfBirth = req.body.yearOfBirth;
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword
  let emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  let report = {}
  
  // let body = req.body
  //  for(let i in body){
  // }

  if(password.length<8){
          res.status(400)
          report["passwordLength-password"] = "Password must be 8 or more character*"
          checkStatus = false;
  }else{
    report["passwordLength-password"] = ""

  }
  if(password!=confirmPassword){
    report["pwCheck-confirmPassword"] = "Confirm password is different*"
    checkStatus = false;
}else{
  report["pwCheck-confirmPassword"] = ""

}


  if(!email.match(emailFormat)){
report["Format-email"] = "invalid Email*"
   checkStatus = false;
  }else{
    report["Format-email"] = ""

  }
  for (let user of users) {
      if (user.email == email) {
        report["duplicate-email"] = "Email already used*"
        checkStatus = false;
      continue
    }else{
      report["duplicate-email"] = ""
    }
  }
  if (checkStatus) {
    users.push({
      title: title,
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
    res.status(400)
    res.json(report)
  }
}
