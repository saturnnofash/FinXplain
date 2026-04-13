"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  strong?: boolean;
  className?: string;
  children: React.ReactNode;
}

export default function GlassCard({
  strong = false,
  className = "",
  children,
  ...rest
}: GlassCardProps) {
  const base = strong
    ? "bg-[rgba(255,255,255,0.11)] border border-[rgba(255,255,255,0.18)] backdrop-blur-[24px]"
    : "bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.12)] backdrop-blur-[16px]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-[20px] ${base} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
