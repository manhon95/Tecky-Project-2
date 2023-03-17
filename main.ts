import express from "express";
import { Request, Response } from "express";

const app = express();

app.get("/", function (req: Request, res: Response) {
  res.end("Hello World");
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}/`);
});