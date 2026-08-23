"use client";

import { useState } from "react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div role="status" className="rounded-2xl bg-brand-50 p-6 text-sm text-ink-900">
        お問い合わせを受け付けました。担当者よりご連絡いたします。
      </div>
    );
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-ink-900">
          お名前
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-ink-900">
          メールアドレス
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-ink-900">
          お問い合わせ内容
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-full bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        送信する
      </button>
    </form>
  );
}
