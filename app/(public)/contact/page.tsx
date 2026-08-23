import type { Metadata } from "next";
import { PageHero } from "@/app/_components/page-hero";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "問い合わせ" };

export default function ContactPage() {
  return (
    <main>
      <PageHero
        eyebrow="問い合わせ"
        title="お問い合わせ"
        lead="サービスに関するご質問は、こちらのフォームからご連絡ください。相談を始めたい場合は会員登録もご利用いただけます。"
      />
      <section className="mx-auto max-w-xl px-4 py-14 sm:px-6">
        <ContactForm />
      </section>
    </main>
  );
}
