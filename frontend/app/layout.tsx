import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InsightGraph — Multi-Agent Intelligence",
  description:
    "Ask any technical question. Multi-agent AI researches, analyzes, and renders charts in real time.",
  keywords: ["AI dashboard", "LangGraph", "multi-agent", "data visualization", "Gemini"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#080C14] text-slate-100 antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
