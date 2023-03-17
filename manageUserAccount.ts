import { Request, Response } from "express";
import jsonfile from "jsonfile";

let users: User[] = jsonfile.readFileSync("userDetail.json");
// let usersFile = "userDetail.j"
type User = {
  id: string;
  Title: string;
  firstName: string;
  lastName: string;
  monthOfBirth: number;
  yearOfBirth: number;
  email: string;
  areaCode: string;
  phoneNumber: string;
  password: string;
};

//This function get info from http request and save as use detail
export async function saveUserDetails(req: Request, res: Response) {
  let checkStatus = true;
  let id = "hbnznk58r6"
  // Math.random().toString(36).substring(3);
  let Title = req.body.Title;
  let firstName = req.body.firstName;
  let lastName = req.body.lastName;
  let monthOfBirth = req.body.monthOfBirth;
  let yearOfBirth = req.body.yearOfBirth;
  let email = req.body.email;
  let areaCode = req.body.areaCode;
  let phoneNumber = req.body.phoneNumber;
  let password = req.body.password;

  for (let userId of users) {
    // check if req msg id in userId array
    console.log(userId.id, id);

    if (userId.id == id) {
      checkStatus = false;
      console.log("id in users")
      break;
    }
  }
console.log(checkStatus);
  if (checkStatus) {
    users.push({
      id,
      Title,
      firstName,
      lastName,
      monthOfBirth,
      yearOfBirth,
      email,
      areaCode,
      phoneNumber,
      password,
    });
    await jsonfile.writeFile("userDetail.json", users);
    res.end("done");
  } else {
    res.end("not submit");
  }
}

export async function passwordChecker(req: Request, res: Response) {}
