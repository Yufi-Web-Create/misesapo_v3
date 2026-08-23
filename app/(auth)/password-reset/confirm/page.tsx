import type { Metadata } from "next";
import { PasswordResetConfirmForm } from "./password-reset-confirm-form";

export const metadata: Metadata = { title: "新しいパスワードの設定" };

export default function PasswordResetConfirmPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-ink-900">新しいパスワードの設定</h1>
      <PasswordResetConfirmForm />
    </div>
  );
}
