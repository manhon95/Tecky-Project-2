import express, { NextFunction, Request, Response } from "express";
import { saveUserDetails } from "./register";
import { print } from "listening-on";
import path from "path";
import http from "http";
import { addMiddleware } from "./middleware";
import { initSocketServer } from "./socketIO/socketIOManager";
import { roomRoutes } from "./routes/room.routes";
import { userRoutes } from "./routes/user.routes";
import { playerRoutes } from "./routes/player.routes";
import { checkLoginToLobby, hasLogin } from "./guard";
import grant from "grant";
import { env } from "./env";
import { badgeRoutes } from "./routes/badges.routes";
import { lobbyRoutes } from "./routes/lobby.routes";
import { loginRoutes } from "./routes/login.routes";
import { registerRoutes } from "./routes/register.routes";
import { commonRoutes } from "./routes/common.routes";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
initSocketServer(server);

addMiddleware(app);

app.use(
  // TODO: move this route to userRoutes
  grant.express({
    defaults: {
      origin: "http://localhost:" + env.port,
      transport: "session",
      state: true,
    },
    google: {
      key: env.GOOGLE_CLIENT_ID || "",
      secret: env.GOOGLE_CLIENT_SECRET || "",
      scope: ["profile", "email"],
      callback: "/login/google",
    },
  })
);
app.use("/user", hasLogin, express.static("protected"));
// app.use(userRoutes);
app.use(commonRoutes);
app.use(loginRoutes);
app.use(registerRoutes);
app.use(roomRoutes);
app.use(playerRoutes);
app.use(badgeRoutes);
app.use(lobbyRoutes);

app.use(checkLoginToLobby);

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
