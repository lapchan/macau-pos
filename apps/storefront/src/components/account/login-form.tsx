"use client";

import { useState } from "react";

type Props = {
  locale: string;
  tenantName: string;
  accentColor?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function LoginForm({ locale, tenantName, accentColor = "#4f46e5" }: Props) {
  const [step, setStep] = useState<"contact" | "verify">("contact");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);

  const handleCodeInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  };

  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div
          className="mx-auto flex size-12 items-center justify-center rounded-xl text-white font-bold text-lg"
          style={{ backgroundColor: accentColor }}
        >
          {tenantName.charAt(0).toUpperCase()}
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          {step === "contact"
            ? t(locale, "登入您的帳號", "Sign in to your account", "Entre na sua conta", "アカウントにログイン")
            : t(locale, "輸入驗證碼", "Enter verification code", "Digite o código de verificação", "認証コードを入力")
          }
        </h2>
        {step === "contact" && (
          <p className="mt-2 text-center text-sm text-gray-500">
            {t(locale, "我們會發送驗證碼到您的手機或電郵", "We'll send a verification code to your phone or email", "Enviaremos um código de verificação", "認証コードを送信します")}
          </p>
        )}
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
        <div className="bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12">
          {step === "contact" ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep("verify");
              }}
              className="space-y-6"
            >
              {/* Method toggle */}
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

              {/* Input */}
              <div>
                <label htmlFor="contact" className="block text-sm font-medium text-gray-700">
                  {method === "phone"
                    ? t(locale, "手機號碼", "Phone number", "Número de telefone", "電話番号")
                    : t(locale, "電子郵件", "Email address", "Endereço de email", "メールアドレス")
                  }
                </label>
                <input
                  id="contact"
                  type={method === "phone" ? "tel" : "email"}
                  required
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={method === "phone" ? "+853 6XXX XXXX" : "your@email.com"}
                  className="mt-2 block w-full rounded-md border-0 py-2.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-sf-accent sm:text-sm"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="flex w-full justify-center rounded-md px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ backgroundColor: accentColor }}
              >
                {t(locale, "發送驗證碼", "Send verification code", "Enviar código", "認証コードを送信")}
              </button>
            </form>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Handle verification
              }}
              className="space-y-6"
            >
              <p className="text-center text-sm text-gray-500">
                {t(locale, `驗證碼已發送至 ${contact}`, `Code sent to ${contact}`, `Código enviado para ${contact}`, `${contact} にコードを送信しました`)}
              </p>

              {/* 6-digit code input */}
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
                        const prev = document.getElementById(`code-${i - 1}`);
                        prev?.focus();
                      }
                    }}
                    className="size-12 rounded-lg border-0 text-center text-lg font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-sf-accent"
                  />
                ))}
              </div>

              {/* Verify */}
              <button
                type="submit"
                className="flex w-full justify-center rounded-md px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                style={{ backgroundColor: accentColor }}
              >
                {t(locale, "驗證並登入", "Verify & sign in", "Verificar e entrar", "認証してログイン")}
              </button>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep("contact")}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t(locale, "重新發送驗證碼", "Resend code", "Reenviar código", "コードを再送")}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Register link */}
        <p className="mt-10 text-center text-sm text-gray-500">
          {t(locale, "還沒有帳號？", "Don't have an account?", "Não tem conta?", "アカウントをお持ちでない方")}{" "}
          <a href={`/${locale}/register`} className="font-semibold text-sf-accent hover:text-sf-accent-hover">
            {t(locale, "立即註冊", "Sign up", "Cadastre-se", "新規登録")}
          </a>
        </p>
      </div>
    </div>
  );
}
