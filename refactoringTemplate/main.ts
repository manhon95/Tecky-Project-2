import express, { NextFunction, Request, Response } from "express";
import { print } from "listening-on";
import http from "http";
import { addMiddleware } from "./middleware";
import { initSocketServer } from "./socketIO/socketIOManager";
import grant from "grant";
import { env } from "./env";
import { pageRoutes } from "./routes/page.routes";

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
/* -------------------------------- important ------------------------------- */
app.use(pageRoutes); // Add your Page route here
/* -------------------------------- important ------------------------------- */
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
