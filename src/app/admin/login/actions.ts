"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import {
  SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifyPassword,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(_: LoginState, data: FormData): Promise<LoginState> {
  const email = String(data.get("email") ?? "").trim().toLowerCase();
  const password = String(data.get("password") ?? "");
  const next = String(data.get("next") ?? "/admin");

  if (!email || !password) return { error: "Enter your email and password." };

  const rows = await sql`
    select id, email, password_hash from admin_users where email = ${email} limit 1
  `;
  const user = rows[0] as { id: string; email: string; password_hash: string } | undefined;

  // Same message and similar timing whether the email exists or not.
  const ok = user ? await verifyPassword(password, user.password_hash) : false;
  if (!user || !ok) {
    await new Promise((r) => setTimeout(r, 400));
    return { error: "That email and password don't match." };
  }

  await sql`update admin_users set last_login_at = now() where id = ${user.id}`;

  const jar = await cookies();
  jar.set(SESSION_COOKIE, await createSessionToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}
