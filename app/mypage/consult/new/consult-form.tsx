"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startConsultation } from "@/lib/actions/consultation";

export function ConsultForm({ stores }: { stores: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [storeId, setStoreId] = useState(stores[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await startConsultation({ storeId, message });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(`/mypage/cases/${result.data.caseId}`);
        });
      }}
    >
      {stores.length > 1 ? (
        <div>
          <label htmlFor="consult-store" className="block text-sm font-medium text-ink-900">
            店舗
          </label>
          <select
            id="consult-store"
            value={storeId}
            onChange={(event) => setStoreId(event.target.value)}
            className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div>
        <label htmlFor="consult-message" className="block text-sm font-medium text-ink-900">
          ご相談内容
        </label>
        <textarea
          id="consult-message"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          rows={6}
          placeholder="例：ネイルサロンをやっています。予約ページにつながる紹介ページを作りたいです。"
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !storeId}
        className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "送信中..." : "相談を送る"}
      </button>
    </form>
  );
}
