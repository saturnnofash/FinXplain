export type Provider = "GCash" | "BPI" | "Maya";

export interface ProviderTheme {
  primary: string;
  dark: string;
  light: string;
  cardBg: string;
  cardBorder: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  glow: string;
  barColor: string;
  logoPath: string;
  iconPath: string;
}

export const providerThemes: Record<Provider, ProviderTheme> = {
  GCash: {
    primary: "#1972F9",
    dark: "#0B2757",
    light: "#518FFB",
    cardBg: "linear-gradient(145deg, #0B2757 0%, #080c14 70%)",
    cardBorder: "rgba(25,114,249,0.3)",
    badgeBg: "rgba(25,114,249,0.15)",
    badgeText: "#518FFB",
    badgeBorder: "rgba(25,114,249,0.35)",
    glow: "0 0 60px rgba(25,114,249,0.12)",
    barColor: "#1972F9",
    logoPath: "/logos/gcash-logo.png",
    iconPath: "/icons/gcash-icon.svg",
  },
  BPI: {
    primary: "#B11116",
    dark: "#2a0608",
    light: "#FFC107",
    cardBg: "linear-gradient(145deg, #2a0608 0%, #080c14 70%)",
    cardBorder: "rgba(177,17,22,0.3)",
    badgeBg: "rgba(177,17,22,0.15)",
    badgeText: "#FFC107",
    badgeBorder: "rgba(255,193,7,0.35)",
    glow: "0 0 60px rgba(177,17,22,0.12)",
    barColor: "#FFC107",
    logoPath: "/logos/bpi-logo.png",
    iconPath: "/icons/bpi-icon.svg",
  },
  Maya: {
    primary: "#008E56",
    dark: "#012e1f",
    light: "#50B16B",
    cardBg: "linear-gradient(145deg, #012e1f 0%, #080c14 70%)",
    cardBorder: "rgba(0,142,86,0.3)",
    badgeBg: "rgba(0,142,86,0.15)",
    badgeText: "#50B16B",
    badgeBorder: "rgba(0,142,86,0.35)",
    glow: "0 0 60px rgba(0,142,86,0.12)",
    barColor: "#50B16B",
    logoPath: "/logos/maya-logo.png",
    iconPath: "/icons/maya-icon.svg",
  },
};

export function getTheme(provider: string): ProviderTheme {
  return providerThemes[provider as Provider] ?? providerThemes["GCash"];
}
