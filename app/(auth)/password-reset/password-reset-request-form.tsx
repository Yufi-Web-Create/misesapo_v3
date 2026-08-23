"use client";

import { useActionState } from "react";
import { requestPasswordReset } from "@/lib/auth/password-reset-actions";

export function PasswordResetRequestForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="mt-6 rounded-lg bg-brand-50 p-4 text-sm text-ink-900">
        再設定用のメールを送信しました（該当するアカウントがある場合）。メールをご確認ください。
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="reset-email" className="block text-sm font-medium text-ink-900">
          メールアドレス
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
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
        {pending ? "送信中..." : "再設定メールを送る"}
      </button>
    </form>
  );
}
