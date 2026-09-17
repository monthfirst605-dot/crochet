// Pure Web Crypto — safe to import from middleware (edge) and from server code.
const ITERATIONS = 100_000;
const SESSION_DAYS = 7;

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters.");
  }
  return new TextEncoder().encode(s);
}

const b64url = {
  encode(bytes: ArrayBuffer | Uint8Array): string {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    let s = "";
    for (const byte of b) s += String.fromCharCode(byte);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  },
  decode(text: string): Uint8Array {
    const padded = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(
      text.length + ((4 - (text.length % 4)) % 4), "=",
    );
    const s = atob(padded);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  },
};

export type Session = { sub: string; email: string; exp: number };

// Workaround: with @types/node loaded alongside the "dom" lib, the global
// Uint8Array type loses its ArrayBuffer-only generic parameter, so it no
// longer structurally matches BufferSource (which SubtleCrypto methods
// require). The values are correct Uint8Arrays at runtime; only the type
// needs help.
function buf(u: Uint8Array): BufferSource {
  return u as unknown as BufferSource;
}

async function hmacKey() {
  return crypto.subtle.importKey(
    "raw", buf(secret()), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"],
  );
}

export async function createSessionToken(admin: { id: string; email: string }): Promise<string> {
  const payload: Session = {
    sub: admin.id,
    email: admin.email,
    exp: Date.now() + SESSION_DAYS * 86_400_000,
  };
  const body = b64url.encode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(), buf(new TextEncoder().encode(body)));
  return `${body}.${b64url.encode(sig)}`;
}

export async function readSessionToken(token: string | undefined): Promise<Session | null> {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify(
      "HMAC", await hmacKey(), buf(b64url.decode(sig)), buf(new TextEncoder().encode(body)),
    );
    if (!ok) return null;
    const session = JSON.parse(new TextDecoder().decode(b64url.decode(body))) as Session;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw", buf(new TextEncoder().encode(password)), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: buf(salt), iterations: ITERATIONS, hash: "SHA-256" }, key, 256,
  );
  return `pbkdf2$${ITERATIONS}$${b64url.encode(salt)}$${b64url.encode(bits)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iters, saltPart, hashPart] = stored.split("$");
  if (scheme !== "pbkdf2") return false;
  const decode = (t: string) => b64url.decode(t);
  const key = await crypto.subtle.importKey(
    "raw", buf(new TextEncoder().encode(password)), "PBKDF2", false, ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: buf(decode(saltPart)), iterations: Number(iters), hash: "SHA-256" },
    key, 256,
  );
  const a = new Uint8Array(bits);
  const b = decode(hashPart);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export const SESSION_COOKIE = "mt_admin";
export const SESSION_MAX_AGE = SESSION_DAYS * 86_400;
