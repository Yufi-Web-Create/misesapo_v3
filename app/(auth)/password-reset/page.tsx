import type { Metadata } from "next";
import { PasswordResetRequestForm } from "./password-reset-request-form";

export const metadata: Metadata = { title: "パスワード再設定" };

export default function PasswordResetPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-ink-900">パスワード再設定</h1>
      <p className="mt-2 text-sm text-ink-700">
        登録済みのメールアドレスを入力してください。再設定用のリンクをお送りします。
      </p>
      <PasswordResetRequestForm />
    </div>
  );
}
