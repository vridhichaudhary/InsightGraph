import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "InsightGraph — Technical Intelligence Dashboard",
  description:
    "Ask any technical question and get instant AI-powered data visualizations powered by Google Gemini.",
  keywords: ["AI dashboard", "data visualization", "Gemini", "technical insights"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-[#0F172A] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
