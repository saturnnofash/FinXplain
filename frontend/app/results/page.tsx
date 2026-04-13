"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Check,
  Minus,
  ArrowRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getTheme } from "@/lib/providerTheme";

function peso(n: number) {
  return `₱${n.toLocaleString()}`;
}

export default function ResultsPage() {
  const router = useRouter();
  const { result, reset } = useAppStore();

  useEffect(() => {
    if (!result) router.replace("/profile");
  }, [result, router]);

  if (!result) return null;

  const r = result;
  const theme = getTheme(r.provider);
  const confidence = Math.round(r.confidence * 100);
  const maxContribution = Math.max(
    ...r.key_factors.map((f) => Math.abs(f.contribution))
  );

  return (
    <div
      className="w-full px-4 sm:px-8 lg:px-16 py-8 mx-auto"
      style={{ maxWidth: 1920 }}
    >
      <div className="flex flex-col gap-8">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm transition-colors cursor-pointer hover:text-foreground"
            style={{ color: "rgba(255,255,255,0.5)", background: "none", border: "none" }}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            Back
          </button>
        </motion.div>

        {/* SECTION 1 — Hero Recommendation Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          style={{
            background: theme.cardBg,
            border: `1px solid ${theme.cardBorder}`,
            borderRadius: 20,
            boxShadow: theme.glow,
            padding: 32,
          }}
        >
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left column */}
            <div style={{ flex: 0.6 }}>
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 16,
                  background: theme.badgeBg,
                  border: `1px solid ${theme.cardBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src={theme.logoPath}
                  width={48}
                  height={48}
                  alt={`${r.provider} logo`}
                />
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "4px 14px",
                  borderRadius: 999,
                  background: theme.badgeBg,
                  color: theme.badgeText,
                  border: `1px solid ${theme.badgeBorder}`,
                  marginTop: 12,
                  display: "inline-block",
                }}
              >
                {r.provider}
              </div>

              <h1
                style={{
                  fontSize: "clamp(28px, 3.5vw, 36px)",
                  fontWeight: 800,
                  color: "white",
                  lineHeight: 1.15,
                  marginTop: 12,
                }}
              >
                {r.product_name}
              </h1>

              <p
                style={{
                  fontSize: 17,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.75,
                  maxWidth: 560,
                  marginTop: 12,
                }}
              >
                {r.summary}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 16,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {r.risk_level}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {r.liquidity}
                </span>
              </div>
            </div>

            {/* Right column */}
            <div style={{ flex: 0.4 }}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Confidence",
                    value: `${confidence}%`,
                    highlight: true,
                  },
                  { label: "Interest rate", value: r.interest_rate },
                  { label: "Min balance", value: peso(r.min_balance) },
                  { label: "Product type", value: r.product_type },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                        marginBottom: 6,
                        fontWeight: 500,
                      }}
                    >
                      {stat.label}
                    </div>
                    <div
                      style={{
                        fontSize: stat.highlight ? 40 : 28,
                        fontWeight: stat.highlight ? 800 : 700,
                        color: stat.highlight ? theme.light : "white",
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>

              <p
                style={{
                  fontSize: 17,
                  color: "rgba(255,255,255,0.45)",
                  marginTop: 8,
                }}
              >
                The AI is {confidence}% confident this is the right product for
                you.
              </p>
            </div>
          </div>

          {r.requires_bank && (
            <div
              style={{
                background: "rgba(55,138,221,0.08)",
                border: "1px solid rgba(55,138,221,0.2)",
                borderRadius: 12,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 24,
              }}
            >
              <Info
                style={{ color: "#85B7EB", flexShrink: 0 }}
                size={20}
                aria-hidden="true"
              />
              <span
                style={{ fontSize: 15, color: "rgba(255,255,255,0.7)" }}
              >
                This product requires an existing bank account.
              </span>
            </div>
          )}
        </motion.div>

        {/* SECTION 2 — Why This Was Recommended */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16 }}
        >
          <section aria-labelledby="why-heading">
            <h2
              id="why-heading"
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "white",
                marginBottom: 20,
              }}
            >
              Why we recommend this for you
            </h2>

            {/* Reasons card */}
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 24,
              }}
            >
              {r.top_reasons.map((reason, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "14px 0",
                    borderBottom:
                      i < r.top_reasons.length - 1
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "none",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(93,202,165,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={14} style={{ color: "#5DCAA5" }} />
                  </div>
                  <span
                    style={{
                      fontSize: 17,
                      color: "white",
                      lineHeight: 1.6,
                    }}
                  >
                    {reason}
                  </span>
                </div>
              ))}

              {r.against_reasons.length > 0 && (
                <>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 20,
                      marginBottom: 12,
                    }}
                  >
                    Things to consider
                  </h3>
                  {r.against_reasons.map((reason, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: "14px 0",
                        borderBottom:
                          i < r.against_reasons.length - 1
                            ? "1px solid rgba(255,255,255,0.08)"
                            : "none",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.05)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Minus
                          size={14}
                          style={{ color: "rgba(255,255,255,0.4)" }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 17,
                          color: "rgba(255,255,255,0.5)",
                          lineHeight: 1.6,
                        }}
                      >
                        {reason}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Key factors */}
            <h3
              style={{
                fontSize: 17,
                fontWeight: 600,
                color: "white",
                marginBottom: 16,
                marginTop: 24,
              }}
            >
              What influenced this recommendation
            </h3>

            <div>
              {r.key_factors.map((factor, i) => {
                const pct = Math.max(
                  4,
                  (Math.abs(factor.contribution) / maxContribution) * 100
                );
                const isSupports = factor.direction === "supports";
                const contribStr =
                  factor.contribution > 0
                    ? `+${factor.contribution.toFixed(2)}`
                    : factor.contribution.toFixed(2);
                const impactColor =
                  factor.impact === "high"
                    ? "#5DCAA5"
                    : factor.impact === "medium"
                      ? "#EF9F27"
                      : "rgba(255,255,255,0.4)";

                return (
                  <div key={i}>
                    {/* Desktop */}
                    <div
                      className="hidden sm:grid"
                      style={{
                        gridTemplateColumns: "180px 1fr 80px",
                        gap: 12,
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          color: "rgba(255,255,255,0.7)",
                          textAlign: "right",
                        }}
                      >
                        {factor.label}
                      </div>
                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.08)",
                          width: "100%",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            background: isSupports
                              ? theme.barColor
                              : "rgba(255,255,255,0.2)",
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isSupports
                              ? theme.light
                              : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {contribStr}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: impactColor,
                          }}
                        >
                          {factor.impact}
                        </div>
                      </div>
                    </div>

                    {/* Mobile */}
                    <div className="sm:hidden" style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 15,
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {factor.label}
                        </span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isSupports
                              ? theme.light
                              : "rgba(255,255,255,0.4)",
                          }}
                        >
                          {contribStr}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 10,
                          borderRadius: 999,
                          background: "rgba(255,255,255,0.08)",
                          width: "100%",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 999,
                            background: isSupports
                              ? theme.barColor
                              : "rgba(255,255,255,0.2)",
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </motion.div>

        {/* SECTION 3 — Counterfactuals */}
        {r.counterfactuals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.24 }}
          >
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "white",
              }}
            >
              Want a different recommendation?
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 20,
              }}
            >
              Here are some changes that could lead to a different product being
              recommended for you.
            </p>

            {r.counterfactuals.slice(0, 3).map((cf, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                style={{
                  width: "100%",
                  background: "rgba(29,158,117,0.06)",
                  border: "1px solid rgba(29,158,117,0.2)",
                  borderRadius: 16,
                  padding: 24,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      fontSize: 17,
                      color: "white",
                      lineHeight: 1.7,
                    }}
                  >
                    {cf.suggestion}
                  </span>
                  <ArrowRight
                    size={20}
                    style={{ color: "#5DCAA5", flexShrink: 0 }}
                    aria-hidden="true"
                  />
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 16,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 999,
                      padding: "6px 14px",
                      display: "inline-flex",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      Currently:{" "}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {String(cf.current_value)}
                    </span>
                  </span>

                  <ArrowRight
                    size={16}
                    style={{ color: "rgba(255,255,255,0.3)" }}
                    aria-hidden="true"
                  />

                  <span
                    style={{
                      background: "rgba(93,202,165,0.1)",
                      border: "1px solid rgba(93,202,165,0.25)",
                      borderRadius: 999,
                      padding: "6px 14px",
                      display: "inline-flex",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#5DCAA5" }}>
                      Change to:{" "}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      {String(cf.suggested_value)}
                    </span>
                  </span>

                  <span
                    style={{
                      background: "rgba(93,202,165,0.08)",
                      border: "1px solid rgba(93,202,165,0.2)",
                      borderRadius: 12,
                      padding: "8px 14px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        color: "#5DCAA5",
                        fontWeight: 600,
                      }}
                    >
                      → {cf.alternative_product_name}
                    </span>
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* SECTION 4 — Other Products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.32 }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "white",
            }}
          >
            Other products we looked at
          </h2>
          <p
            style={{
              fontSize: 17,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 20,
            }}
          >
            These products were also considered for your profile.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {r.top_products.map((p, i) => {
              const pTheme = getTheme(p.provider);
              const isTop = i === 0;

              return (
                <div
                  key={i}
                  role="button"
                  tabIndex={0}
                  style={{
                    borderRadius: 16,
                    padding: 24,
                    minHeight: 160,
                    position: "relative",
                    border: isTop
                      ? `2px solid ${theme.primary}`
                      : "1px solid rgba(255,255,255,0.08)",
                    background: isTop
                      ? `${theme.primary}0f`
                      : "rgba(255,255,255,0.03)",
                  }}
                >
                  {isTop && (
                    <span
                      style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: theme.badgeBg,
                        color: theme.badgeText,
                        fontSize: 12,
                        padding: "4px 12px",
                        borderRadius: 999,
                      }}
                    >
                      Best match
                    </span>
                  )}

                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "3px 10px",
                      borderRadius: 999,
                      background: pTheme.badgeBg,
                      color: pTheme.badgeText,
                      border: `1px solid ${pTheme.badgeBorder}`,
                      display: "inline-block",
                    }}
                  >
                    {p.provider}
                  </span>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "white",
                      marginTop: 12,
                    }}
                  >
                    {p.product_name}
                  </div>

                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: 800,
                      color: isTop ? theme.light : pTheme.light,
                      marginTop: 8,
                    }}
                  >
                    {Math.round(p.score * 100)}% match
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "rgba(255,255,255,0.4)",
                    }}
                  >
                    match score
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* SECTION 5 — Action Row */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              gap: 16,
              flexWrap: "wrap",
              paddingTop: 16,
              paddingBottom: 40,
            }}
          >
            <button
              onClick={() => {
                reset();
                router.push("/profile");
              }}
              style={{
                background: "#5DCAA5",
                color: "#080c14",
                fontWeight: 700,
                borderRadius: 999,
                padding: "16px 36px",
                fontSize: 17,
                border: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={18} />
              Start over
            </button>

            <button
              onClick={() => router.push("/")}
              style={{
                background: "transparent",
                color: "white",
                fontWeight: 500,
                borderRadius: 999,
                padding: "16px 36px",
                fontSize: 17,
                border: "1px solid rgba(255,255,255,0.2)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <Info size={18} />
              Back to home
            </button>
          </div>

          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.25)",
              maxWidth: 480,
              textAlign: "center",
              margin: "16px auto 0",
            }}
          >
            FinXplain is a research prototype and not a licensed financial
            advisor. Always consult a professional.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
