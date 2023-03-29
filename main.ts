import express, { NextFunction, Request, Response } from "express";
import { saveUserDetails } from "./createUserAccount";
import { print } from "listening-on";
import path from "path";
import http from "http";
import { sessionMiddleware } from "./session-middleware";
import { initSocketServer } from "./socketIOManager";
import { createRoomRoutes } from "./routes/room.routes";
import { userRoutes } from "./routes/user.routes";
import { createPlayerRoutes } from "./routes/player.routes";
import { isLoggedIn } from "./guard";
import grant from "grant";
import { env } from "./env";

let app = express();
let server = http.createServer(app);

// Initialize Socket.IO server
let io = initSocketServer(app, server);

app.use(express.static("public"));

app.use(express.urlencoded());
app.use(express.json());

app.use(sessionMiddleware);

app.use(grant.express({
  defaults: {
    origin: 'http://localhost:'+env.port,
    transport: "session",
    state: true,
  },
  google: {
    key: env.GOOGLE_CLIENT_ID || "",
    secret: env.GOOGLE_CLIENT_SECRET || "",
    scope: ["profile", "email"],
    callback: "/login/google",
  },
}))

app.use(userRoutes);
app.use(createRoomRoutes(io));
app.use(createPlayerRoutes(io));
app.use("/user", isLoggedIn, express.static("protected"));

app.post("/register", (req: Request, res: Response) => {
  saveUserDetails(req, res);
});

app.get("/login", (req: Request, res: Response) => {
  res.sendFile(path.resolve("public", "login-page.html"));
});

app.get("/user/gameroom", (req: Request, res: Response) => {
  res.sendFile(path.resolve("protected", "gameroom.html"));
});

app.use((req: Request, res: Response) => {
  res.status(404);
  res.redirect("/login");
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if ("statusCode" in error) {
    res.status(error.statusCode);
  } else {
    res.status(500);
  }
  let message = String(error);
  message = message.replace(/\w+: /, "");
  res.json({
    error: message,
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  print(PORT);
});
