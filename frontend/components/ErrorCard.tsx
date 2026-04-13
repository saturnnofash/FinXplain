"use client";

import { motion } from "framer-motion";
import GlassButton from "./GlassButton";

interface ErrorCardProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function ErrorCard({
  message,
  actionLabel,
  onAction,
}: ErrorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.3)] backdrop-blur-[16px] rounded-[20px] p-6 flex flex-col items-center gap-4 text-center"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm text-red-300">{message}</p>
      {actionLabel && onAction && (
        <GlassButton variant="secondary" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      )}
    </motion.div>
  );
}
