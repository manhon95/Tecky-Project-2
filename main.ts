import express, { Request, Response } from "express";
import { saveUserDetails } from "./manageUserAccount";
import { passwordChecker } from "./LoginAuthenticate";
import { print } from "listening-on";
import path from "path";
// import { Client } from "pg";
// import dotenv from "dotenv";


// dotenv.config();
// export  const client = new Client({
//   database: process.env.DB_NAME,
//   user: process.env.DB_USERNAME,
//   password: process.env.DB_PASSWORD,
// });
// client.connect()

// import Session from "express-session";
//  import {}
let app = express();

app.use(express.static("public"));
app.use(express.urlencoded());
app.use(express.json());
// app.use(Session({
//       secret: Math.random().toString(36),
//       resave: false,
//       saveUninitialized: false,
//     })
//   );
//   declare module "express-session" {
//     interface SessionData {
//       user: {email: string}
//     }
//   }

// app.post()
app.post("/register", (req: Request, res: Response) => {
  saveUserDetails(req, res);
});
app.post("/login", (req: Request, res: Response) => {
  passwordChecker(req, res);
});

app.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login-page.html"));
});

app.use((req: Request, res: Response) => {
  res.redirect("/login");
});

// app.get("/submit" )
const PORT = 8080;
app.listen(PORT, () => {
  print(PORT);
});
