"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createAndSendQuote } from "@/lib/actions/admin-case";

export function QuoteForm({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-3 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const amountCents = Math.round(Number(amount) * 100);
        if (!Number.isFinite(amountCents) || amountCents <= 0) {
          setError("金額を正しく入力してください。");
          return;
        }
        startTransition(async () => {
          const result = await createAndSendQuote({ caseId, amountCents, scopeSummary: scope });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <div>
        <label htmlFor="quote-amount" className="block text-sm font-medium text-ink-900">
          金額（円）
        </label>
        <input
          id="quote-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="quote-scope" className="block text-sm font-medium text-ink-900">
          契約範囲・内容
        </label>
        <textarea
          id="quote-scope"
          value={scope}
          onChange={(event) => setScope(event.target.value)}
          required
          rows={3}
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
        disabled={pending}
        className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? "送信中..." : "見積を送付する"}
      </button>
    </form>
  );
}
