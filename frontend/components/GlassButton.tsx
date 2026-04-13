"use client";

import { type ButtonHTMLAttributes } from "react";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

export default function GlassButton({
  variant = "primary",
  className = "",
  children,
  ...rest
}: GlassButtonProps) {
  const base =
    variant === "primary"
      ? "bg-[rgba(93,202,165,0.2)] border border-[rgba(93,202,165,0.4)] text-accent-teal hover:bg-[rgba(93,202,165,0.3)]"
      : "bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.1)]";

  return (
    <button
      className={`rounded-xl px-6 py-2.5 text-sm font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${base} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
