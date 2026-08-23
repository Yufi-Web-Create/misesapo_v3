"use client";

import { useActionState } from "react";
import { register } from "@/lib/auth/actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, { status: "idle" });

  if (state.status === "check-email") {
    return (
      <div role="status" className="mt-6 rounded-lg bg-brand-50 p-4 text-sm text-ink-900">
        確認メールを送信しました。メール内のリンクから登録を完了してください。
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="register-store" className="block text-sm font-medium text-ink-900">
          店舗名
        </label>
        <input
          id="register-store"
          name="storeName"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="register-name" className="block text-sm font-medium text-ink-900">
          お名前
        </label>
        <input
          id="register-name"
          name="displayName"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="register-email" className="block text-sm font-medium text-ink-900">
          メールアドレス
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="register-password" className="block text-sm font-medium text-ink-900">
          パスワード（8文字以上）
        </label>
        <input
          id="register-password"
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
        {pending ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
