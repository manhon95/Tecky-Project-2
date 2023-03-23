import { Request, Response } from "express";
import jsonfile from "jsonfile";
import fs from "fs"
import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();
export  const client = new Client({
  database: process.env.DB_NAME,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
});


/* --------------------------- bug fix suggestion --------------------------- */

//import fs from "fs";

const filePath = "userDetail.json"; //filePath wil use several times

try {
  fs.accessSync(filePath, fs.constants.F_OK); //this function will return error if user file is not accessible
} catch (error) {
  fs.writeFileSync(filePath, JSON.stringify([])); // it error happen, create a new file with json empty array
}

export let users: User[] = jsonfile.readFileSync(filePath); //load the user array from user file, export them so that it can be reused in other files

/* ----------------------------------- end ---------------------------------- */
let maxId = 0
// export let users: User[] = jsonfile.readFileSync("userDetail.json");
type User = {
  id: number
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

  for(let user of users){
    maxId = Math.max(maxId, user.id||0)
  }
  let checkStatus = true;
  let id = maxId + 1
  let title = req.body.title;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let monthOfBirth = req.body.monthOfBirth;
  let yearOfBirth = req.body.yearOfBirth;
  let email = req.body.email;
  let password = req.body.password;
  let confirmPassword = req.body.confirmPassword;
  let emailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

  let report = {};



  if (password.length < 8) {
    res.status(400);
    report["passwordLength-password"] = "Password must be 8 or more character*";
    checkStatus = false;
  } else {
    report["passwordLength-password"] = "";
  }
  
  if (password != confirmPassword) {
    report["pwCheck-password"] = "Confirm password is different*";
  if(password!=confirmPassword){
    report["pwCheck-password"] = "Confirm password is different*"
    checkStatus = false;
  } else {
    report["pwCheck-password"] = "";
  }
}else{
  report["pwCheck-password"] = ""

}

  if (!email.match(emailFormat)) {
    report["Format-email"] = "invalid Email*";
    checkStatus = false;
  } else {
    report["Format-email"] = "";
  }
  for (let user of users) {
    if (user.email == email) {
      report["duplicate-email"] = "Email already used*";
      checkStatus = false;
      continue;
    } else {
      report["duplicate-email"] = "";
    }
  }
  if (checkStatus) {
    users.push({
      id,
      title,
      firstName,
      lastName,
      monthOfBirth,
      yearOfBirth,
      email,
      password,
    });
    await jsonfile.writeFile("userDetail.json", users);

    //----------------------------------------------------------------------------------------------
    //using ajax
main().catch(e => console.error(e))


    res.end("done");
  } else {
    res.status(400);
    res.json(report);
  }
  async function main(){
    await client.connect()
  await client.query(/* sql */'insert into "user" (id, email, user_name, password) values ($1,$2,$3,$4)', [id, email, firstName, password]) 
  
  
    await client.end()
    console.log("account create success")
  }
}
