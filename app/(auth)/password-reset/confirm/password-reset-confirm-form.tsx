"use client";

import Link from "next/link";
import { useActionState } from "react";
import { confirmPasswordReset } from "@/lib/auth/password-reset-actions";

export function PasswordResetConfirmForm() {
  const [state, formAction, pending] = useActionState(confirmPasswordReset, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div className="mt-6 space-y-4">
        <p role="status" className="rounded-lg bg-brand-50 p-4 text-sm text-ink-900">
          パスワードを更新しました。
        </p>
        <Link
          href="/login"
          className="block w-full rounded-full bg-brand-600 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
        >
          ログインする
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="new-password" className="block text-sm font-medium text-ink-900">
          新しいパスワード（8文字以上）
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "更新中..." : "パスワードを更新する"}
      </button>
    </form>
  );
}
