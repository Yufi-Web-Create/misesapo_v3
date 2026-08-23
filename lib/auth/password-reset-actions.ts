"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PasswordResetState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; error: string };

const emailSchema = z.string().trim().email();

export async function requestPasswordReset(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { status: "error", error: "メールアドレスを正しく入力してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${appUrl}/password-reset/confirm`,
  });

  // Always report success, whether or not the address is registered, so we
  // never leak account existence.
  return { status: "sent" };
}

const newPasswordSchema = z.string().min(8, "パスワードは8文字以上で入力してください。");

export async function confirmPasswordReset(
  _prevState: PasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  const parsed = newPasswordSchema.safeParse(formData.get("password"));
  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return {
      status: "error",
      error: "パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。",
    };
  }

  return { status: "sent" };
}
