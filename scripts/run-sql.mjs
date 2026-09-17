// Runs a .sql file against Neon. Needs Node 22+ (for global WebSocket).
// Equivalent:  psql "$DATABASE_URL" -f db/schema.sql
import { readFileSync } from "node:fs";
import { Client, neonConfig } from "@neondatabase/serverless";

const file = process.argv[2];
if (!file) { console.error("usage: node scripts/run-sql.mjs <file.sql>"); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is not set."); process.exit(1); }
if (!globalThis.WebSocket) {
  console.error('Node 22+ needed. Otherwise run:  psql "$DATABASE_URL" -f ' + file);
  process.exit(1);
}

neonConfig.webSocketConstructor = globalThis.WebSocket;
const client = new Client(process.env.DATABASE_URL);

try {
  await client.connect();
  await client.query(readFileSync(file, "utf8"));
  console.log(`Ran ${file}.`);
} catch (err) {
  console.error(`Failed on ${file}: ${err.message}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
