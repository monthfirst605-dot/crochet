// Creates or updates an admin login.
//   npm run admin:create -- you@example.com "your password" "Your Name"
import { neon } from "@neondatabase/serverless";
import { webcrypto as crypto } from "node:crypto";

const [email, password, name] = process.argv.slice(2);
if (!email || !password) {
  console.error('usage: npm run admin:create -- <email> "<password>" "[name]"');
  process.exit(1);
}
if (password.length < 10) { console.error("Use a password of at least 10 characters."); process.exit(1); }

const ITERATIONS = 100_000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, key, 256);
const b64 = (b) => Buffer.from(b).toString("base64url");
const hash = `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(bits)}`;

const sql = neon(process.env.DATABASE_URL);
await sql`
  insert into admin_users (email, name, password_hash)
  values (${email}, ${name ?? null}, ${hash})
  on conflict (email) do update set password_hash = excluded.password_hash,
                                    name = coalesce(excluded.name, admin_users.name)
`;
console.log(`Admin ready: ${email}`);
