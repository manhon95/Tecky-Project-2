import { Client } from "pg";
import { env } from "./env";

const client = new Client({
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

client.connect().catch((err) => {
  console.error("Failed to connect to database:", err);
  process.exit(1);
});

export default client;
