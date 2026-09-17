"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/admin/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required
               autoComplete="current-password" className="field" />
      </div>

      {state.error && (
        <p role="alert" className="rounded-lg bg-cocoa px-4 py-3 text-sm text-shell">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-cocoa px-6 py-3 font-semibold text-shell disabled:opacity-60"
      >
        {pending ? "Checking…" : "Sign in"}
      </button>
      <p className="text-xs text-bark">
        No account yet? Run <code>npm run admin:create -- you@example.com &quot;password&quot;</code>
      </p>
    </form>
  );
}
