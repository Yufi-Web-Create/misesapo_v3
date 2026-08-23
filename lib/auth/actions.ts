"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

export type AuthActionState = { error: string } | { error: null };

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function login(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "メールアドレスとパスワードを入力してください。" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Do not distinguish "no such account" from "wrong password".
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/mypage");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    // Fail safe: do not claim success if we could not confirm the session ended.
    redirect("/mypage");
  }
  redirect("/login");
}

const registerSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "パスワードは8文字以上で入力してください。"),
  displayName: z.string().trim().min(1, "お名前を入力してください。"),
  storeName: z.string().trim().min(1, "店舗名を入力してください。"),
});

export type RegisterActionState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "check-email" };

export async function register(
  _prevState: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
    storeName: formData.get("storeName"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      error: parsed.error.issues[0]?.message ?? "入力内容を確認してください。",
    };
  }

  const { email, password, displayName, storeName } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error || !data.user) {
    return {
      status: "error",
      error: "登録に失敗しました。すでに登録済みのメールアドレスの可能性があります。",
    };
  }

  // Privileged onboarding writes (organization/store/profile/membership) are not
  // reachable via RLS from the authenticated role by design (see the RLS
  // migration), so this bootstrap step uses the service-role client. It only
  // ever runs for the user id just returned by signUp.
  const admin = createSupabaseServiceRoleClient();

  let { data: org } = await admin.from("organizations").select("id").limit(1).maybeSingle();
  if (!org) {
    const { data: createdOrg, error: orgError } = await admin
      .from("organizations")
      .insert({ name: "ミセサポAI運営" })
      .select("id")
      .single();
    if (orgError || !createdOrg) {
      return {
        status: "error",
        error: "登録処理中にエラーが発生しました。時間をおいて再度お試しください。",
      };
    }
    org = createdOrg;
  }

  const { data: store, error: storeError } = await admin
    .from("stores")
    .insert({ organization_id: org.id, name: storeName })
    .select("id")
    .single();

  if (storeError || !store) {
    return {
      status: "error",
      error: "登録処理中にエラーが発生しました。時間をおいて再度お試しください。",
    };
  }

  await admin.from("user_profiles").insert({
    id: data.user.id,
    role: "customer",
    display_name: displayName,
    email,
  });
  await admin
    .from("memberships")
    .insert({ user_id: data.user.id, store_id: store.id, role: "owner" });
  await admin.from("customer_profiles").insert({ user_id: data.user.id, store_id: store.id });

  if (data.session) {
    redirect("/mypage");
  }

  return { status: "check-email" };
}
