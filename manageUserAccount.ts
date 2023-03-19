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
  //  for(let i of body){
  //   console.log(i)
  // }

  if(password.length<8){
          res.status(400)
          report["passwordLength"] = "Password must be 8 or more character*"
          checkStatus = false;
  }else{
    report["passwordLength"] = ""

  }
  if(password!=confirmPassword){
    report["confirmPassword"] = "Confirm password is different*"
    checkStatus = false;
}else{
  report["confirmPassword"] = ""

}


  if(!email.match(emailFormat)){
    console.log("emailFormat")
report["emailFormat"] = "invalid Email*"
   checkStatus = false;
  }else{
    report["emailFormat"] = ""

  }
  for (let user of users) {
      if (user.email == email) {
        console.log("email already used")
        report["duplicateEmail"] = "Email already used*"
        checkStatus = false;
      break;
    }else{
      report["duplicateEmail"] = ""
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
    res.end("not submit");
  }
}
