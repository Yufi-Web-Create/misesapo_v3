import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "会員登録" };

export default function RegisterPage() {
  return (
    <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
      <h1 className="text-xl font-bold text-ink-900">会員登録</h1>
      <p className="mt-2 text-sm text-ink-700">登録後、すぐに無料相談を始められます。</p>
      <RegisterForm />
      <p className="mt-6 text-sm text-ink-500">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
