type Message = { id: string; sender_type: string; body: string };

export function AdminCaseChat({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return <p className="mt-3 text-sm text-ink-500">まだメッセージがありません。</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {messages.map((m) => (
        <li key={m.id} className="rounded-2xl bg-brand-50/60 px-4 py-2 text-sm text-ink-900">
          <span className="mr-2 text-xs font-semibold text-brand-600">
            {m.sender_type === "customer" ? "お客様" : m.sender_type === "ai" ? "AI" : "管理者"}
          </span>
          {m.body}
        </li>
      ))}
    </ul>
  );
}
