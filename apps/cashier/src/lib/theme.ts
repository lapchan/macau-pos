export type MerchantTheme = {
  name: string;
  accent: string;
  accentHover: string;
  accentLight: string;
  accentSoft: string;
};

export const merchantThemes: Record<string, MerchantTheme> = {
  default: {
    name: "CountingStars",
    accent: "#0071e3",
    accentHover: "#0077ed",
    accentLight: "#0071e310",
    accentSoft: "#0071e318",
  },
  forest: {
    name: "Green Market",
    accent: "#28a745",
    accentHover: "#2dbe4e",
    accentLight: "#28a74510",
    accentSoft: "#28a74518",
  },
  sunset: {
    name: "Sunset Café",
    accent: "#e8590c",
    accentHover: "#f06418",
    accentLight: "#e8590c10",
    accentSoft: "#e8590c18",
  },
  plum: {
    name: "Plum Studio",
    accent: "#7c3aed",
    accentHover: "#8b5cf6",
    accentLight: "#7c3aed10",
    accentSoft: "#7c3aed18",
  },
  noir: {
    name: "Noir Boutique",
    accent: "#1d1d1f",
    accentHover: "#333336",
    accentLight: "#1d1d1f10",
    accentSoft: "#1d1d1f18",
  },
};

export function applyTheme(theme: MerchantTheme) {
  const root = document.documentElement;
  root.style.setProperty("--color-pos-accent", theme.accent);
  root.style.setProperty("--color-pos-accent-hover", theme.accentHover);
  root.style.setProperty("--color-pos-accent-light", theme.accentLight);
  root.style.setProperty("--color-pos-accent-soft", theme.accentSoft);
}
