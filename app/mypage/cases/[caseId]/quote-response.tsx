"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToQuote } from "@/lib/actions/customer-quote";

export function QuoteResponse({
  quoteId,
  amountCents,
  scopeSummary,
}: {
  quoteId: string;
  amountCents: number;
  scopeSummary: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "accept" | "decline") {
    setError(null);
    startTransition(async () => {
      const result = await respondToQuote({ quoteId, decision });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/60 p-6">
      <h2 className="font-semibold text-ink-900">お見積りのご案内</h2>
      <p className="mt-2 text-lg font-bold text-ink-900">
        {(amountCents / 100).toLocaleString()}円
      </p>
      <p className="mt-1 text-sm text-ink-700">{scopeSummary}</p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("accept")}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          この内容で進める
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("decline")}
          className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-ink-700 hover:border-red-400 hover:text-red-600 disabled:opacity-60"
        >
          見送る
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
