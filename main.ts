import express, { NextFunction, Request, Response } from "express";
import { print } from "listening-on";
import http from "http";
import { addMiddleware } from "./middleware";
import { initSocketServer, io } from "./socketIO/socketIOManager";
import { roomRoutes } from "./routes/room.routes";
import { checkLoginToLobby, hasLogin } from "./guard";
import grant from "grant";
import { env } from "./env";
import { shopRoutes } from "./routes/shop.routes";
import { lobbyRoutes } from "./routes/lobby.routes";
import { loginRoutes } from "./routes/login.routes";
import { registerRoutes } from "./routes/register.routes";
import { commonRoutes } from "./routes/common.routes";
import { profileRoutes } from "./routes/profile.routes";
import { socialRoutes } from "./routes/social.routes";
import { verifyRoutes } from "./routes/verify.routes";
import { coupRoutes } from "./routes/coup.route";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server
initSocketServer(server);

// io.on("connection", (socket) => {
//   console.log(socket.id);
// });
addMiddleware(app);

app.use(
  // TODO: move this route to userRoutes
  grant.express({
    defaults: {
      origin: "http://localhost:" + env.PORT,
      transport: "session",
      state: true,
    },
    google: {
      key: env.GOOGLE_CLIENT_ID,
      secret: env.GOOGLE_CLIENT_SECRET,
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
app.use(lobbyRoutes);
app.use(profileRoutes);
app.use(roomRoutes);
app.use(socialRoutes);
app.use(shopRoutes);
app.use(verifyRoutes);
app.use(coupRoutes);

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

server.listen(env.PORT, () => {
  print(env.PORT);
});
