import { config } from "dotenv";
import populateEnv from "populate-env";

export let env = {
  DB_NAME: "",
  DB_USER: "",
  DB_PASSWORD: "",
  // GOOGLE_CLIENT_ID: '',
  // GOOGLE_CLIENT_SECRET: '',
};

config();
populateEnv(env, { mode: "halt" });
