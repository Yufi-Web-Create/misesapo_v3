"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendCustomerMessage } from "@/lib/actions/consultation";

type Message = { id: string; sender_type: string; body: string; created_at: string };

export function CaseChat({
  caseId,
  initialMessages,
}: {
  caseId: string;
  initialMessages: Message[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4">
      <ul className="space-y-3">
        {initialMessages.map((m) => (
          <li
            key={m.id}
            className={
              m.sender_type === "customer"
                ? "ml-auto max-w-[80%] rounded-2xl bg-brand-600 px-4 py-2 text-sm text-white"
                : "max-w-[80%] rounded-2xl bg-brand-50 px-4 py-2 text-sm text-ink-900"
            }
          >
            {m.body}
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await sendCustomerMessage({ caseId, message });
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setMessage("");
            router.refresh();
          });
        }}
      >
        <label htmlFor="case-chat-input" className="sr-only">
          メッセージ
        </label>
        <input
          id="case-chat-input"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          className="flex-1 rounded-full border border-black/10 px-4 py-2 text-sm"
          placeholder="メッセージを入力"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          送信
        </button>
      </form>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
