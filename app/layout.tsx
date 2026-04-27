import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevPrompt Playground",
  description:
    "Compare zero-shot, few-shot, and chain-of-thought prompting across OpenAI and Anthropic side-by-side.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg text-slate-100 antialiased">{children}</body>
    </html>
  );
}
