import type { Metadata } from "next";
import { Noto_Sans_TC } from "next/font/google";
import "./globals.css";

const notoSansTC = Noto_Sans_TC({
  variable: "--font-noto-sans-tc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "庫洛米數學樂園 - 幼兒加法遊戲",
  description: "專為 5-6 歲幼兒設計的 10 以內加法遊戲，庫洛米風格，有趣的動畫和音效",
  keywords: ["幼兒", "數學", "加法", "遊戲", "庫洛米", "教育"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${notoSansTC.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
