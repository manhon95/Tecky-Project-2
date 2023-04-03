import { config } from "dotenv";
import populateEnv from "populate-env";

export let env = {
  PORT: 8080,
  DB_NAME: "",
  DB_USER: "",
  DB_PASSWORD: "",
  GOOGLE_CLIENT_ID: "",
  GOOGLE_CLIENT_SECRET: "",
  BOT_NAME: "",
  NODEMAILER_EMAIL:"",
  NODEMAILER_PW:"",
};

config();
populateEnv(env, { mode: "halt" });

