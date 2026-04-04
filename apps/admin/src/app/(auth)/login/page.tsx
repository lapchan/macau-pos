"use client";

import { useActionState } from "react";
import { login } from "@/lib/auth-actions";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import type { Locale } from "@macau-pos/i18n";
import { localeNames } from "@macau-pos/i18n";
import { t } from "@/i18n/locales";

function useLoginLocale(): Locale {
  const [locale, setLocale] = useState<Locale>("tc");
  useEffect(() => {
    // Try localStorage first, then cookie
    const saved = localStorage.getItem("admin-locale") as Locale | null;
    if (saved && saved in localeNames) {
      setLocale(saved);
      return;
    }
    const match = document.cookie.match(/admin-locale=(\w+)/);
    if (match && match[1] in localeNames) {
      setLocale(match[1] as Locale);
    }
  }, []);
  return locale;
}

export default function LoginPage() {
  const locale = useLoginLocale();
  const [state, formAction, isPending] = useActionState(login, null);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-[var(--radius-md)] bg-[var(--color-accent)] mb-4">
            <span className="text-white text-lg font-bold">CS</span>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            CountingStars
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {t(locale, "login.signInSubtitle")}
          </p>
        </div>

        {/* Login form */}
        <form action={formAction} className="space-y-4">
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-border)] p-6 space-y-4">
            {/* Error message */}
            {state?.error && (
              <div className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-sm)]">
                {state.error}
              </div>
            )}

            {/* Email / Phone */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                {t(locale, "login.emailOrPhone")}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                autoComplete="username"
                required
                placeholder={t(locale, "login.emailPlaceholder")}
                className="w-full h-10 px-3 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
              >
                {t(locale, "login.password")}
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder={t(locale, "login.passwordPlaceholder")}
                  className="w-full h-10 px-3 pr-10 text-sm bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-sm)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t(locale, "login.hidePassword") : t(locale, "login.showPassword")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-10 flex items-center justify-center gap-2 bg-[var(--color-accent)] text-white text-sm font-medium rounded-[var(--radius-sm)] hover:bg-[var(--color-accent-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {t(locale, "login.signInButton")}
              </>
            )}
          </button>
        </form>

        {/* Demo hint */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {t(locale, "login.demoHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
