import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "FX PATTERN MEMORY",
    template: "%s | FX PATTERN MEMORY",
  },
  description: "世界中のトレーダーの実戦経験を、値動きの形から検索できるPattern Library",
  robots: { index: true, follow: true },
  openGraph: {
    title: "FX PATTERN MEMORY",
    description: "そのチャート、前にも誰かが見ている。値動きの形からPattern Libraryを検索。",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "var(--bg)" }}>
        {children}
      </body>
    </html>
  );
}
