"use client";

import { motion } from "framer-motion";

interface ProductCardProps {
  product_name: string;
  provider: string;
  score: number;
  highlighted?: boolean;
  index?: number;
  highlightColor?: string;
  highlightBadgeBg?: string;
  highlightBadgeText?: string;
}

const providerStyle: Record<string, { bg: string; text: string; border: string }> = {
  GCash: { bg: "rgba(25,114,249,0.15)", text: "#518FFB", border: "rgba(25,114,249,0.3)" },
  BPI: { bg: "rgba(177,17,22,0.15)", text: "#FFC107", border: "rgba(177,17,22,0.3)" },
  Maya: { bg: "rgba(0,142,86,0.15)", text: "#50B16B", border: "rgba(0,142,86,0.3)" },
};

const fallbackStyle = { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.6)", border: "rgba(255,255,255,0.2)" };

export default function ProductCard({
  product_name,
  provider,
  score,
  highlighted = false,
  index = 0,
  highlightColor,
  highlightBadgeBg,
  highlightBadgeText,
}: ProductCardProps) {
  const ps = providerStyle[provider] ?? fallbackStyle;
  const borderColor = highlighted && highlightColor ? highlightColor : "rgba(255,255,255,0.12)";
  const badgeBg = highlighted && highlightBadgeBg ? highlightBadgeBg : "rgba(93,202,165,0.15)";
  const badgeText = highlighted && highlightBadgeText ? highlightBadgeText : "#5DCAA5";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      style={{
        background: "rgba(255,255,255,0.07)",
        backdropFilter: "blur(16px)",
        borderRadius: 20,
        padding: 20,
        border: highlighted ? `2px solid ${borderColor}` : "1px solid rgba(255,255,255,0.12)",
      }}
    >
      {highlighted && (
        <span
          style={{
            display: "inline-block",
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: badgeText,
            background: badgeBg,
            padding: "2px 10px",
            borderRadius: 999,
            marginBottom: 12,
          }}
        >
          Recommended
        </span>
      )}
      <h3 style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
        {product_name}
      </h3>
      <span
        style={{
          display: "inline-block",
          fontSize: 11,
          fontWeight: 500,
          padding: "2px 8px",
          borderRadius: 999,
          background: ps.bg,
          color: ps.text,
          border: `1px solid ${ps.border}`,
        }}
      >
        {provider}
      </span>
      <div style={{ marginTop: 12, color: badgeText, fontWeight: 700, fontSize: 18 }}>
        {(score * 100).toFixed(1)}%
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>Match score</p>
    </motion.div>
  );
}
