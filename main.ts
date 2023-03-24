import express, { Request, Response } from "express";
import { saveUserDetails } from "./manageUserAccount";
import { passwordChecker } from "./LoginAuthenticate";
import { print } from "listening-on";
import path from "path";
import { sessionMiddleWare } from "./session-middleWare";
import { isLoggedIn } from "./guard";

let app = express();

app.use(express.static("public"));

app.use(express.urlencoded());
app.use(express.json());
app.use(sessionMiddleWare)

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
app.use(isLoggedIn, express.static('protected'))

app.get('/gameroom', (req: Request, res: Response) => {
  res.sendFile(path.resolve("protected", "gameroom.html"));
});




// app.use((req: Request, res: Response) => {
//   res.redirect("/login");
// });

// app.get("/submit" )
const PORT = 8080;
app.listen(PORT, () => {
  print(PORT);
});
