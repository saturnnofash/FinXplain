import type { Metadata } from "next";
import { Inter, Figtree } from "next/font/google";
import "./globals.css";
import ClientShell from "./ClientShell";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FinXplain — Explainable AI for Filipino Savings",
  description:
    "AI-powered savings recommendations built for Filipinos — with full transparency on every decision.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", figtree.variable)}>
      <body
        className="w-full min-h-screen m-0 p-0 bg-[#0a1628] text-white antialiased"
        suppressHydrationWarning
      >
        <ClientShell>{children}</ClientShell>
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "rgba(15, 30, 53, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              backdropFilter: "blur(16px)",
            },
          }}
        />
      </body>
    </html>
  );
}
