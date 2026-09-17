import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Copy .env.example to .env.local and fill it in.");
}

/**
 * Neon's HTTP driver: one round trip per query, no connection pool to warm up.
 * That's what keeps cold requests on serverless fast.
 *   const rows = await sql`select 1`;
 */
export const sql = neon(process.env.DATABASE_URL);
