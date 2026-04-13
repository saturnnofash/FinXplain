"use client";

import { motion } from "framer-motion";
import type { Counterfactual } from "@/types/api";

interface CounterfactualCardProps {
  item: Counterfactual;
  index?: number;
}

function formatValue(v: string | number): string {
  if (typeof v === "number") {
    return `₱${v.toLocaleString()}`;
  }
  return String(v);
}

export default function CounterfactualCard({
  item,
  index = 0,
}: CounterfactualCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="bg-[rgba(29,158,117,0.2)] border border-[rgba(93,202,165,0.25)] backdrop-blur-[16px] rounded-[20px] p-5"
    >
      <p className="text-accent-teal text-sm font-medium mb-3">
        {item.suggestion}
      </p>

      <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
        <span className="bg-[rgba(255,255,255,0.08)] px-2 py-1 rounded-lg">
          {formatValue(item.current_value)}
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
        <span className="bg-accent-teal/15 text-accent-teal px-2 py-1 rounded-lg">
          {formatValue(item.suggested_value)}
        </span>
      </div>

      <p className="text-xs text-text-muted">
        Alternative:{" "}
        <span className="text-text-secondary">
          {item.alternative_product_name}
        </span>{" "}
        by{" "}
        <span className="text-text-secondary">{item.alternative_provider}</span>
      </p>
    </motion.div>
  );
}
