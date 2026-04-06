"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendVerificationCode, verifyCodeAndLogin } from "@/lib/actions/auth";

type Props = {
  locale: string;
  tenantName: string;
  accentColor: string;
  themeId?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function LoginPageClient({ locale, tenantName, accentColor, themeId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"contact" | "verify">("contact");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await sendVerificationCode(contact, method);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setStep("verify");
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError(t(locale, "請輸入6位驗證碼", "Please enter 6-digit code", "Digite o código de 6 dígitos", "6桁のコードを入力してください"));
      return;
    }

    setLoading(true);
    setError(null);

    const result = await verifyCodeAndLogin(contact, fullCode, locale);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push(`/${locale}/account`);
      router.refresh();
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }
    if (value && index === 5) {
      const fullCode = [...newCode].join("");
      if (fullCode.length === 6) {
        setTimeout(() => {
          document.getElementById("verify-btn")?.click();
        }, 100);
      }
    }
  };

  /* ─── HUMAN MADE variant ───
     Matches humanmade.jp/zh_hant/account/login/
     - max-width 376px centered
     - h4 title "登入"
     - email + password fields with labels
     - remember me + forgot password row
     - full-width LOGIN black button
     - full-width CREATE AN ACCOUNT outlined button
     - breadcrumb at bottom on mobile
  */
  if (themeId === "humanmade") {
    return (
      <div className="bg-white min-h-[60vh]">
        <div className="mx-auto py-8 px-4 sm:pt-12 sm:pb-8" style={{ maxWidth: "376px" }}>
          {/* Title */}
          <h4
            className="text-[#121212] mb-2"
            style={{ fontSize: "18px", letterSpacing: "0.05em", lineHeight: "1.4" }}
          >
            {t(locale, "登入", "Login", "Entrar", "ログイン")}
          </h4>

          {/* Subtitle */}
          <p
            className="text-[#121212]/60 mb-6"
            style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.8" }}
          >
            {t(
              locale,
              "請輸入您的電子郵件地址和密碼以登入。",
              "Enter your email address and password to sign in.",
              "Digite seu email e senha para entrar.",
              "メールアドレスとパスワードを入力してログインしてください。"
            )}
          </p>

          {error && (
            <div
              className="mb-4 px-3 py-2 text-[#dc3545] border border-[#dc3545]/20"
              style={{ fontSize: "12px", letterSpacing: "0.04em" }}
            >
              {error}
            </div>
          )}

          {step === "contact" ? (
            <form onSubmit={handleSendCode}>
              {/* Email Address */}
              <div className="mb-3">
                <label
                  htmlFor="login-email"
                  className="block text-[#121212]/60 mb-1"
                  style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                >
                  {t(locale, "電子郵件", "Email Address", "Email", "メールアドレス")}
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={contact}
                  onChange={(e) => { setContact(e.target.value); setMethod("email"); }}
                  className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212]"
                  style={{ fontSize: "14px", letterSpacing: "0.03em" }}
                />
              </div>

              {/* Password */}
              <div className="mb-4">
                <label
                  htmlFor="login-password"
                  className="block text-[#121212]/60 mb-1"
                  style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                >
                  {t(locale, "密碼", "Password", "Senha", "パスワード")}
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full border-b border-[#121212]/20 bg-transparent py-2 pr-10 text-[#121212] outline-none transition-colors focus:border-[#121212]"
                    style={{ fontSize: "14px", letterSpacing: "0.03em" }}
                  />
                  {/* Eye toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#121212]/40 hover:text-[#121212]/70 transition-colors"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot password row */}
              <div className="flex items-start justify-between mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="size-4 border border-[#121212]/30 accent-[#121212]"
                  />
                  <span className="text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.05em" }}>
                    {t(locale, "記住我", "Remember me", "Lembrar-me", "ログイン状態を保持")}
                  </span>
                </label>
                <a
                  href={`/${locale}/forgot-password`}
                  className="text-[#121212]/60 hover:text-[#121212] transition-colors"
                  style={{ fontSize: "13px", letterSpacing: "0.03em" }}
                >
                  {t(locale, "忘記密碼？", "Forgot password?", "Esqueceu a senha?", "パスワードを忘れた方")}
                </a>
              </div>

              {/* LOGIN button — full-width, black */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#121212] py-3.5 text-white hover:bg-[#121212]/90 transition-colors disabled:bg-[#121212]/40 disabled:cursor-not-allowed"
                style={{ fontSize: "13px", letterSpacing: "0.15em" }}
              >
                {loading ? "..." : "LOGIN"}
              </button>

              {/* CREATE AN ACCOUNT button — full-width, outlined */}
              <a
                href={`/${locale}/register`}
                className="mt-3 flex w-full items-center justify-center border border-[#121212] py-3.5 text-[#121212] hover:bg-[#121212] hover:text-white transition-colors"
                style={{ fontSize: "13px", letterSpacing: "0.15em" }}
              >
                {t(locale, "建立帳號", "CREATE AN ACCOUNT", "CRIAR CONTA", "アカウント作成")}
              </a>
            </form>
          ) : (
            /* ── Verification code step ── */
            <form onSubmit={handleVerify}>
              <p
                className="text-center text-[#121212]/60 mb-6"
                style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.8" }}
              >
                {t(locale, `驗證碼已發送至 ${contact}`, `Code sent to ${contact}`, `Código enviado para ${contact}`, `${contact} にコード送信済み`)}
              </p>

              <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && i > 0) {
                        document.getElementById(`code-${i - 1}`)?.focus();
                      }
                    }}
                    className="size-11 border border-[#121212]/20 bg-transparent text-center text-[#121212] outline-none focus:border-[#121212] transition-colors"
                    style={{ fontSize: "18px" }}
                  />
                ))}
              </div>

              <button
                id="verify-btn"
                type="submit"
                disabled={loading}
                className="w-full bg-[#121212] py-3.5 text-white hover:bg-[#121212]/90 transition-colors disabled:bg-[#121212]/40 disabled:cursor-not-allowed"
                style={{ fontSize: "13px", letterSpacing: "0.15em" }}
              >
                {loading ? "..." : t(locale, "驗證並登入", "VERIFY & SIGN IN", "VERIFICAR", "認証してログイン")}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setStep("contact"); setCode(["", "", "", "", "", ""]); setError(null); }}
                  className="text-[#121212]/60 hover:text-[#121212] transition-colors"
                  style={{ fontSize: "12px", letterSpacing: "0.05em" }}
                >
                  {t(locale, "重新發送驗證碼", "Resend code", "Reenviar", "コードを再送")}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Breadcrumb — bottom, mobile only (like humanmade.jp) */}
        <div className="px-4 pb-8 sm:hidden">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1.5 text-[#121212]/50" style={{ fontSize: "11px", letterSpacing: "0.06em" }}>
              <li><a href={`/${locale}`} className="hover:text-[#121212] transition-colors">TOP</a></li>
              <li><span className="mx-0.5">›</span></li>
              <li className="text-[#121212]">{t(locale, "登入", "Login", "Entrar", "ログイン")}</li>
            </ol>
          </nav>
        </div>
      </div>
    );
  }

  /* ─── Default variant ── */
  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-xl text-white font-bold text-lg"
          style={{ backgroundColor: accentColor }}
        >
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          {step === "contact"
            ? t(locale, "登入您的帳號", "Sign in to your account", "Entre na sua conta", "アカウントにログイン")
            : t(locale, "輸入驗證碼", "Enter verification code", "Digite o código", "認証コードを入力")
          }
        </h2>
        {step === "contact" && (
          <p className="mt-2 text-center text-sm text-gray-500">
            {t(locale, "我們會發送驗證碼到您的手機或電郵", "We'll send a verification code", "Enviaremos um código", "認証コードを送信します")}
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}

          {step === "contact" ? (
            <form onSubmit={handleSendCode} className="space-y-6">
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${method === "phone" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  {t(locale, "手機", "Phone", "Telefone", "電話")}
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("email")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${method === "email" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
                >
                  {t(locale, "電郵", "Email", "Email", "メール")}
                </button>
              </div>

              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                  {method === "phone"
                    ? t(locale, "手機號碼", "Phone number", "Telefone", "電話番号")
                    : t(locale, "電子郵件", "Email", "Email", "メール")
                  }
                </label>
                <input
                  id="contact"
                  type={method === "phone" ? "tel" : "email"}
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={method === "phone" ? "+853 6XXX XXXX" : "your@email.com"}
                  className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? "..." : t(locale, "發送驗證碼", "Send code", "Enviar código", "コードを送信")}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              <p className="text-center text-sm text-gray-500">
                {t(locale, `驗證碼已發送至 ${contact}`, `Code sent to ${contact}`, `Código enviado para ${contact}`, `${contact} にコード送信済み`)}
              </p>

              <div className="flex justify-center gap-2">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    id={`code-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeInput(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digit && i > 0) {
                        document.getElementById(`code-${i - 1}`)?.focus();
                      }
                    }}
                    className="size-12 rounded-lg border-0 text-center text-lg font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                  />
                ))}
              </div>

              <button
                id="verify-btn"
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {loading ? "..." : t(locale, "驗證並登入", "Verify & sign in", "Verificar", "認証してログイン")}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep("contact"); setCode(["", "", "", "", "", ""]); setError(null); }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t(locale, "重新發送驗證碼", "Resend code", "Reenviar", "コードを再送")}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          {t(locale, "還沒有帳號？", "Don't have an account?", "Não tem conta?", "アカウントをお持ちでない方")}{" "}
          <span className="font-semibold text-indigo-600">
            {t(locale, "輸入電話即可自動註冊", "Enter your phone to auto-register", "Digite para registrar", "電話入力で自動登録")}
          </span>
        </p>
      </div>
    </div>
  );
}
