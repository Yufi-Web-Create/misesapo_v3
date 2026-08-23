import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ミセサポAI",
    template: "%s | ミセサポAI",
  },
  description:
    "予約制の小規模店舗向けに、AIとの会話だけで相談・要件整理・制作・確認・納品まで進められる制作・運用支援サービス。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
