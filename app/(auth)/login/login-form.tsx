"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, { error: null });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-ink-900">
          メールアドレス
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-ink-900">
          パスワード
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
