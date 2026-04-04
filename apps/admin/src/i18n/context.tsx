"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Locale } from "@macau-pos/i18n";
import { localeNames } from "@macau-pos/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "tc",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("tc");
  const [mounted, setMounted] = useState(false);

  // Read saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem("admin-locale") as Locale | null;
    if (saved && saved in localeNames) {
      setLocaleState(saved);
    }
    setMounted(true);
  }, []);

  // Persist locale changes
  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("admin-locale", l);
    document.cookie = `admin-locale=${l};path=/;max-age=31536000`;
    // Update html lang attribute
    document.documentElement.lang = l === "tc" || l === "sc" ? "zh" : l === "pt" ? "pt" : l === "ja" ? "ja" : "en";
  }, []);

  // Sync html lang on mount
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale === "tc" || locale === "sc" ? "zh" : locale === "pt" ? "pt" : locale === "ja" ? "ja" : "en";
    }
  }, [locale, mounted]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
