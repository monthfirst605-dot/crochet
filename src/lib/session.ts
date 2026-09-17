import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, readSessionToken, type Session } from "./auth";

export async function currentAdmin(): Promise<Session | null> {
  const jar = await cookies();
  return readSessionToken(jar.get(SESSION_COOKIE)?.value);
}

/** Use at the top of every admin server action. Middleware guards the pages. */
export async function requireAdmin(): Promise<Session> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
