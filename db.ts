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

export async function begin() {
  await client.query("BEGIN;");
}

export async function commit() {
  await client.query("COMMIT;");
}

export async function rollback() {
  await client.query("ROLLBACK");
}
