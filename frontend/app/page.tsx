"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MoveRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ─── animation keyframes ─── */
function AnimationStyles() {
  return (
    <style>{`
      @keyframes coinSlide {
        0%   { left: -200px; opacity: 0; }
        6%   { opacity: 1; }
        86%  { opacity: 1; }
        94%  { left: calc(100% + 40px); opacity: 0; }
        100% { left: -200px; opacity: 0; }
      }
      @keyframes coinSpin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(720deg); }
      }
      @keyframes tileGrow {
        0%, 8%   { transform: scaleY(0.1); opacity: 0.15; }
        28%, 48% { transform: scaleY(1); opacity: 0.8; }
        68%, 100%{ transform: scaleY(0.1); opacity: 0.15; }
      }
      @keyframes gridPulse {
        0%, 100% { opacity: 0.08; }
        50%      { opacity: 0.9; }
      }
      @keyframes treeDraw {
        0%, 5%   { stroke-dashoffset: 50; opacity: 0.15; }
        35%, 60% { stroke-dashoffset: 0; opacity: 1; }
        85%, 100%{ stroke-dashoffset: 50; opacity: 0.15; }
      }
      @keyframes barGrow {
        0%, 5%   { transform: scaleX(0); }
        30%, 60% { transform: scaleX(1); }
        85%, 100%{ transform: scaleX(0); }
      }
      @keyframes dotTravel {
        0%   { transform: translate(0px, 0px); opacity: 0; }
        10%  { opacity: 1; }
        50%  { transform: translate(25px, -20px); }
        90%  { opacity: 1; }
        100% { transform: translate(50px, -35px); opacity: 0; }
      }
      @keyframes arrowPulse {
        0%, 100% { opacity: 0.3; }
        50%      { opacity: 0.85; }
      }
    `}</style>
  );
}

/* ─── landing navbar ─── */
function LandingNav() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: scrolled ? "12px 16px 0" : "0",
        transition: "padding 0.3s ease",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          maxWidth: scrolled ? "64rem" : undefined,
          margin: "0 auto",
          background: scrolled ? "rgba(8,12,20,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          border: scrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid transparent",
          borderRadius: scrolled ? 16 : 0,
          transition: "all 0.3s ease",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => router.push("/")}
            className="cursor-pointer"
            style={{
              fontWeight: 700,
              fontSize: 20,
              color: "#fff",
              background: "none",
              border: "none",
            }}
          >
            Fin<span style={{ color: "#5DCAA5" }}>Xplain</span>
          </button>

          <div className="hidden md:flex" style={{ alignItems: "center", gap: 6 }}>
            <a
              href="#what-we-recommend"
              className="transition-colors"
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Products
            </a>
            <a
              href="#how-it-works"
              className="transition-colors"
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                padding: "6px 14px",
                borderRadius: 8,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                e.currentTarget.style.background = "transparent";
              }}
            >
              How it works
            </a>
            <button
              onClick={() => router.push("/profile")}
              className="cursor-pointer"
              style={{
                background: "#5DCAA5",
                color: "#080c14",
                fontWeight: 600,
                fontSize: 14,
                borderRadius: 999,
                padding: "8px 20px",
                border: "none",
                marginLeft: 8,
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#4ab896")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#5DCAA5")}
            >
              Get my recommendation
            </button>
          </div>

          <button
            className="flex md:hidden cursor-pointer"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.07)",
              borderRadius: 8,
              color: "#fff",
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? (
                <>
                  <line x1="5" y1="5" x2="15" y2="15" />
                  <line x1="15" y1="5" x2="5" y2="15" />
                </>
              ) : (
                <>
                  <line x1="3" y1="5" x2="17" y2="5" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="15" x2="17" y2="15" />
                </>
              )}
            </svg>
          </button>
        </div>

        {open && (
          <div
            className="md:hidden"
            style={{
              background: "rgba(8,12,20,0.97)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              padding: "16px 24px 24px",
            }}
          >
            <a
              href="#what-we-recommend"
              onClick={() => setOpen(false)}
              style={{ display: "block", padding: "12px 0", fontSize: 15, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
            >
              Products
            </a>
            <a
              href="#how-it-works"
              onClick={() => setOpen(false)}
              style={{ display: "block", padding: "12px 0", fontSize: 15, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}
            >
              How it works
            </a>
            <button
              onClick={() => { setOpen(false); router.push("/profile"); }}
              className="cursor-pointer"
              style={{
                display: "block",
                marginTop: 12,
                background: "#5DCAA5",
                color: "#080c14",
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 999,
                padding: "12px 20px",
                border: "none",
                width: "100%",
                textAlign: "center",
              }}
            >
              Get my recommendation
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── hero coin animation ─── */
function HeroCoinAnimation() {
  const tiles = [
    { left: "3%", h: 125 },
    { left: "14%", h: 188 },
    { left: "25%", h: 263 },
    { left: "36%", h: 350 },
    { left: "47%", h: 400 },
    { left: "58%", h: 363 },
    { left: "69%", h: 288 },
    { left: "80%", h: 200 },
    { left: "91%", h: 150 },
  ];

  return (
    <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          height: 1,
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {tiles.map((t, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 42,
            left: t.left,
            width: 70,
            height: t.h,
            background:
              "linear-gradient(to top, #0d1525 60%, rgba(93,202,165,0.12))",
            borderRadius: "8px 8px 0 0",
            border: "1px solid rgba(255,255,255,0.04)",
            borderBottom: "none",
            transformOrigin: "bottom",
            animation: `tileGrow 4s ${i * 0.35}s ease-in-out infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          bottom: 20,
          width: 270,
          height: 60,
          borderRadius: "50%",
          background: "rgba(201,168,76,0.4)",
          filter: "blur(30px)",
          animation: "coinSlide 5s ease-in-out infinite",
        }}
      />

      <div
        style={{
          position: "absolute",
          bottom: 50,
          animation: "coinSlide 5s ease-in-out infinite",
        }}
      >
        <svg
          className="w-[120px] h-[120px] md:w-[180px] md:h-[180px]"
          viewBox="0 0 160 160"
          style={{ animation: "coinSpin 5s linear infinite", display: "block" }}
        >
          <defs>
            <linearGradient id="cg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="50%" stopColor="#F5D76E" />
              <stop offset="100%" stopColor="#C9A84C" />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="76" fill="url(#cg)" />
          <circle
            cx="80"
            cy="80"
            r="64"
            fill="none"
            stroke="rgba(8,12,20,0.2)"
            strokeWidth="2"
          />
          <text
            x="80"
            y="104"
            textAnchor="middle"
            fontSize="68"
            fontWeight="700"
            fill="rgba(255,255,255,0.85)"
          >
            ₱
          </text>
        </svg>
      </div>
    </div>
  );
}

/* ─── section 1: hero ─── */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

function HeroSection() {
  const router = useRouter();
  const words = ["transparently", "intelligently", "confidently", "effortlessly", "accurately"];
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#080c14",
      }}
    >
      {/* Background animation layer */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          opacity: 0.55,
        }}
      >
        <HeroCoinAnimation />
      </div>

      {/* Content layer */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 760,
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        <motion.div {...fadeUp(0)}>
          <Button variant="secondary" size="sm" className="gap-2 mb-2 rounded-full">
            AI-powered · Filipino fintech · Explainable
          </Button>
        </motion.div>

        <motion.h1
          {...fadeUp(0.1)}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-white text-center"
          style={{ lineHeight: 1.1 }}
        >
          <span>Know your best savings plan.</span>
          <span
            className="relative flex w-full justify-center overflow-hidden md:pb-4 md:pt-1"
            style={{ height: "1.2em" }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={words[wordIndex]}
                className="absolute font-extrabold"
                style={{ color: "#5DCAA5" }}
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 150 }}
                transition={{ type: "spring", stiffness: 50 }}
              >
                {words[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.2)}
          className="text-lg md:text-xl max-w-[540px] text-center leading-relaxed tracking-tight"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          FinXplain uses explainable AI to recommend the right GCash, Maya, or
          BPI savings product for your financial profile.
        </motion.p>

        <motion.div {...fadeUp(0.3)} className="flex gap-3 flex-wrap justify-center">
          <Button
            size="lg"
            className="gap-2"
            onClick={() => router.push("/profile")}
          >
            Get my recommendation
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() =>
              document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See how it works
          </Button>
        </motion.div>

        <motion.p {...fadeUp(0.4)} className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>
          Free · No account required · Research prototype
        </motion.p>
      </div>
    </section>
  );
}

/* ─── section 2: products ─── */

const typeBadge: Record<string, { bg: string; color: string }> = {
  Savings: { bg: "rgba(93,202,165,0.15)", color: "#5DCAA5" },
  Investment: { bg: "rgba(201,168,76,0.15)", color: "#C9A84C" },
  "Time Deposit": { bg: "rgba(55,138,221,0.15)", color: "#85B7EB" },
};

interface Product {
  name: string;
  type: "Savings" | "Investment" | "Time Deposit";
}

interface ProviderCard {
  name: string;
  logo: string;
  icon: string;
  primary: string;
  light: string;
  pillBg: string;
  pillBorder: string;
  cardBg: string;
  cardBorder: string;
  boxShadow?: string;
  badge?: string;
  elevated?: boolean;
  products: Product[];
}

const providerCards: ProviderCard[] = [
  {
    name: "GCash",
    logo: "/logos/gcash-logo.png",
    icon: "/icons/gcash-icon.svg",
    primary: "#1972F9",
    light: "#518FFB",
    pillBg: "rgba(25,114,249,0.15)",
    pillBorder: "rgba(25,114,249,0.3)",
    cardBg: "#080c14",
    cardBorder: "rgba(25,114,249,0.25)",
    products: [
      { name: "GSave (CIMB)", type: "Savings" },
      { name: "GInvest (UITFs)", type: "Investment" },
    ],
  },
  {
    name: "BPI",
    logo: "/logos/bpi-logo.png",
    icon: "/icons/bpi-icon.svg",
    primary: "#B11116",
    light: "#FFC107",
    pillBg: "rgba(177,17,22,0.15)",
    pillBorder: "rgba(177,17,22,0.3)",
    cardBg: "#080c14",
    cardBorder: "rgba(177,17,22,0.25)",
    boxShadow: "0 -8px 40px rgba(255,193,7,0.08)",
    elevated: true,
    products: [
      { name: "BPI Regular Savings", type: "Savings" },
      { name: "BPI #SaveUp", type: "Savings" },
      { name: "BPI Plan Ahead Time Deposit", type: "Time Deposit" },
    ],
  },
  {
    name: "Maya",
    logo: "/logos/maya-logo.png",
    icon: "/icons/maya-icon.svg",
    primary: "#008E56",
    light: "#50B16B",
    pillBg: "rgba(0,142,86,0.15)",
    pillBorder: "rgba(0,142,86,0.3)",
    cardBg: "#080c14",
    cardBorder: "rgba(0,142,86,0.25)",
    products: [
      { name: "Maya Savings", type: "Savings" },
      { name: "Maya Personal Goals", type: "Savings" },
      { name: "Maya Time Deposit Plus", type: "Time Deposit" },
    ],
  },
];

function ProductsSection() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <section id="what-we-recommend" className="w-full" style={{ padding: "100px 0" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-6 md:px-12 lg:px-20">
        {/* Section label */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#5DCAA5",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Our product coverage
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.05 }}
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#fff",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          Products we recommend
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            textAlign: "center",
            maxWidth: 520,
            margin: "0 auto 56px",
            lineHeight: 1.7,
          }}
        >
          FinXplain selects from 8 real savings and investment products across
          three Philippine fintech providers.
        </motion.p>

        {/* Provider cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {providerCards.map((prov, pi) => (
            <motion.div
              key={prov.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: pi * 0.12 }}
              onMouseEnter={() => setHoveredCard(prov.name)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                position: "relative",
                background: prov.cardBg,
                border: `1px solid ${
                  hoveredCard === prov.name
                    ? prov.cardBorder.replace(/[\d.]+\)$/, "0.45)")
                    : prov.cardBorder
                }`,
                borderRadius: 20,
                padding: "32px 28px",
                minHeight: 380,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 20,
                boxShadow: prov.boxShadow ?? "none",
                transform: prov.elevated ? "translateY(-20px)" : "none",
                transition: "border-color 0.2s ease",
              }}
            >
              {/* "Most products" badge */}
              {prov.badge && (
                <span
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "rgba(255,193,7,0.15)",
                    color: "#FFC107",
                    border: "1px solid rgba(255,193,7,0.3)",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: 999,
                  }}
                >
                  {prov.badge}
                </span>
              )}

              {/* Logo area */}
              <div style={{ height: 140, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 16,
                    background: `${prov.primary}1a`,
                    border: `1px solid ${prov.primary}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Image
                    src={prov.logo}
                    alt={`${prov.name} logo`}
                    width={64}
                    height={64}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 999,
                    padding: "4px 14px",
                    letterSpacing: "0.05em",
                    background: prov.pillBg,
                    color: prov.light,
                    border: `1px solid ${prov.pillBorder}`,
                  }}
                >
                  {prov.name}
                </span>
              </div>

              {/* Product list */}
              <div style={{ width: "100%" }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    marginBottom: 12,
                  }}
                >
                  Available products
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {prov.products.map((prod) => {
                    const badge = typeBadge[prod.type];
                    return (
                      <div
                        key={prod.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prov.icon}
                          alt=""
                          width={16}
                          height={16}
                          style={{ flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", flex: 1 }}>
                          {prod.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: badge.bg,
                            color: badge.color,
                            flexShrink: 0,
                          }}
                        >
                          {prod.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── card icons for section 3 ─── */
function EBMIcon() {
  const cells = Array.from({ length: 16 });
  return (
    <div style={{ width: 80, height: 80, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
      {cells.map((_, i) => (
        <div
          key={i}
          style={{
            borderRadius: 3,
            background: "#5DCAA5",
            animation: `gridPulse 2s ${i * 0.12}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function XGBoostIcon() {
  const lines = [
    { x1: 60, y1: 12, x2: 35, y2: 42, d: 0 },
    { x1: 60, y1: 12, x2: 85, y2: 42, d: 0.2 },
    { x1: 35, y1: 42, x2: 18, y2: 72, d: 0.5 },
    { x1: 35, y1: 42, x2: 52, y2: 72, d: 0.6 },
    { x1: 85, y1: 42, x2: 68, y2: 72, d: 0.7 },
    { x1: 85, y1: 42, x2: 102, y2: 72, d: 0.8 },
  ];
  const nodes = [
    { cx: 60, cy: 12, r: 5 },
    { cx: 35, cy: 42, r: 4 },
    { cx: 85, cy: 42, r: 4 },
    { cx: 18, cy: 72, r: 3 },
    { cx: 52, cy: 72, r: 3 },
    { cx: 68, cy: 72, r: 3 },
    { cx: 102, cy: 72, r: 3 },
  ];

  return (
    <svg width="120" height="84" viewBox="0 0 120 84">
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="#378ADD"
          strokeWidth="2"
          strokeLinecap="round"
          style={{
            strokeDasharray: 50,
            animation: `treeDraw 3s ${l.d}s ease-in-out infinite`,
          }}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="#378ADD"
          style={{ animation: `gridPulse 3s ${i * 0.15}s ease-in-out infinite` }}
        />
      ))}
    </svg>
  );
}

function KeyFactorsIcon() {
  const bars = [
    { w: "90%", color: "#5DCAA5", d: 0 },
    { w: "70%", color: "#5DCAA5", d: 0.15 },
    { w: "50%", color: "#5DCAA5", d: 0.3 },
    { w: "30%", color: "rgba(255,255,255,0.2)", d: 0.45 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 120 }}>
      {bars.map((b, i) => (
        <div
          key={i}
          style={{
            height: 12,
            borderRadius: 6,
            background: b.color,
            width: b.w,
            transformOrigin: "left",
            animation: `barGrow 2.5s ${b.d}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

function CounterfactualIcon() {
  return (
    <svg width="100" height="80" viewBox="0 0 100 80">
      {/* Down arrow (current state) */}
      <line x1="25" y1="15" x2="25" y2="55" stroke="#C9A84C" strokeWidth="2" style={{ animation: "arrowPulse 2.5s 0s ease-in-out infinite" }} />
      <polyline points="18,48 25,55 32,48" fill="none" stroke="#C9A84C" strokeWidth="2" style={{ animation: "arrowPulse 2.5s 0s ease-in-out infinite" }} />

      {/* Up arrow (alternative) */}
      <line x1="75" y1="60" x2="75" y2="20" stroke="#C9A84C" strokeWidth="2" style={{ animation: "arrowPulse 2.5s 0.3s ease-in-out infinite" }} />
      <polyline points="68,27 75,20 82,27" fill="none" stroke="#C9A84C" strokeWidth="2" style={{ animation: "arrowPulse 2.5s 0.3s ease-in-out infinite" }} />

      {/* Curved path */}
      <path
        d="M 25 55 C 25 75, 75 5, 75 20"
        fill="none"
        stroke="rgba(201,168,76,0.3)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />

      {/* Traveling dot */}
      <circle
        cx="25"
        cy="55"
        r="4"
        fill="#C9A84C"
        style={{ animation: "dotTravel 2.5s ease-in-out infinite" }}
      />
    </svg>
  );
}

/* ─── section 3: how it works ─── */
const howCards = [
  {
    icon: <EBMIcon />,
    title: "Explainable Boosting Machine",
    desc: "The primary AI model that powers your recommendation. Designed to be both accurate and fully interpretable — unlike black-box AI.",
  },
  {
    icon: <XGBoostIcon />,
    title: "XGBoost benchmark",
    desc: "A second model used to validate recommendation quality. If both models agree, your result is more reliable.",
  },
  {
    icon: <KeyFactorsIcon />,
    title: "Key factors (SHAP/LIME)",
    desc: "Shows exactly which parts of your profile influenced the recommendation and by how much — no guessing.",
  },
  {
    icon: <CounterfactualIcon />,
    title: "Counterfactual suggestions",
    desc: "Tells you what you could change in your profile to receive a different recommendation. Actionable, not just explanatory.",
  },
];

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="w-full"
      style={{ background: "#0d1120", padding: "100px 0" }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }} className="px-6 md:px-12 lg:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: 40, fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 12 }}
        >
          How FinXplain works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.55)",
            textAlign: "center",
            maxWidth: 480,
            margin: "0 auto 56px",
            lineHeight: 1.7,
          }}
        >
          Four technologies working together to give you a recommendation you
          can actually understand.
        </motion.p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              style={{
                background: "#0d1525",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 20,
                padding: "28px 24px",
                minHeight: 280,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                transform: i === 1 || i === 2 ? "translateY(-16px)" : "none",
              }}
            >
              <div style={{ height: 100, display: "flex", alignItems: "center" }}>
                {card.icon}
              </div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
                  {card.title}
                </h3>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                  {card.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── section 4: final CTA ─── */
function CTASection() {
  const router = useRouter();

  return (
    <section className="w-full" style={{ padding: "120px 0", textAlign: "center" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }} className="px-6 md:px-12 lg:px-20">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            fontSize: "clamp(36px, 4vw, 52px)",
            fontWeight: 800,
            color: "#fff",
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
          }}
        >
          Ready to find your
          <br />
          best savings plan?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.5)",
            maxWidth: 480,
            margin: "16px auto 0",
            lineHeight: 1.7,
          }}
        >
          Answer 13 questions about your financial profile. Get a
          recommendation with a full explanation in seconds.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ marginTop: 40 }}
        >
          <button
            onClick={() => router.push("/profile")}
            className="cursor-pointer"
            style={{
              background: "#5DCAA5",
              color: "#080c14",
              fontWeight: 700,
              borderRadius: 999,
              padding: "18px 40px",
              fontSize: 17,
              border: "none",
              transition: "background 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#4ab896";
              e.currentTarget.style.transform = "scale(1.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#5DCAA5";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            Get my recommendation
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 16 }}
        >
          Free &middot; No account required &middot; Research prototype
        </motion.p>
      </div>
    </section>
  );
}

/* ─── footer ─── */
function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: 24,
      }}
    >
      <div
        style={{ maxWidth: 1200, margin: "0 auto" }}
        className="flex flex-col sm:flex-row items-center justify-between gap-2 px-6 md:px-12 lg:px-20"
      >
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          FinXplain &middot; Built for academic research purposes only
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
          Not a licensed financial advisor
        </span>
      </div>
    </footer>
  );
}

/* ─── page export ─── */
export default function LandingPage() {
  return (
    <div style={{ background: "#080c14", minHeight: "100vh" }}>
      <AnimationStyles />
      <LandingNav />
      <HeroSection />
      <ProductsSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
