import { redirect } from "next/navigation";
import { verifyCustomerSession } from "@/lib/auth/verify-session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ConsultForm } from "./consult-form";

export const dynamic = "force-dynamic";

export default async function NewConsultationPage() {
  await verifyCustomerSession();
  const supabase = await createSupabaseServerClient();

  // RLS (private.is_store_member) only returns stores this customer belongs to.
  const { data: stores } = await supabase.from("stores").select("id, name").order("created_at");

  if (!stores || stores.length === 0) {
    redirect("/mypage");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">新規相談</h1>
      <p className="mt-2 text-sm text-ink-700">
        どんなことでも構いません。今のお悩みや作りたいものを、そのまま話しかけてください。
      </p>
      <ConsultForm stores={stores} />
    </main>
  );
}
