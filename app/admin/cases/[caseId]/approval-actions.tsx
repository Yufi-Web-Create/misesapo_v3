"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { decideApproval } from "@/lib/actions/admin-case";

export function ApprovalActions({ approvalRequestId }: { approvalRequestId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const result = await decideApproval({ approvalRequestId, decision });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("approved")}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          承認する
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => decide("rejected")}
          className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium text-ink-700 hover:border-red-400 hover:text-red-600 disabled:opacity-60"
        >
          却下する
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
