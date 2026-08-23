import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "ログイン" };

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-ink-900">ログイン</h1>
      <LoginForm />
      <div className="mt-6 flex flex-col gap-2 text-sm text-ink-500">
        <Link href="/password-reset" className="hover:text-brand-600">
          パスワードをお忘れの方
        </Link>
        <p>
          アカウントをお持ちでない方は{" "}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            会員登録
          </Link>
        </p>
      </div>
    </div>
  );
}
