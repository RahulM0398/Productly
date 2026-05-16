import type { Metadata } from "next";
import { Inter_Tight, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Productly — Before you buy software, let agents investigate it.",
  description:
    "Productly is an AI buying analyst for SaaS and AI products. Two agents investigate pricing, sentiment, switching risk, and trust to deliver a Buy, Trial, Watch, or Avoid recommendation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  );
}
