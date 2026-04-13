"use client";

import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center gap-6 py-20"
    >
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-[rgba(255,255,255,0.1)]" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent-teal animate-spin" />
      </div>
      <div className="bg-[rgba(255,255,255,0.07)] backdrop-blur-[16px] border border-[rgba(255,255,255,0.12)] rounded-[20px] px-8 py-4">
        <p className="text-text-secondary text-sm animate-pulse">
          Analyzing your financial profile...
        </p>
      </div>
    </motion.div>
  );
}
