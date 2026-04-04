"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendVerificationCode, verifyCodeAndLogin } from "@/lib/actions/auth";

type Props = {
  locale: string;
  tenantName: string;
  accentColor: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function LoginPageClient({ locale, tenantName, accentColor }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"contact" | "verify">("contact");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const fullCode = [...newCode].join("");
      if (fullCode.length === 6) {
        // Slight delay to let state update
        setTimeout(() => {
          document.getElementById("verify-btn")?.click();
        }, 100);
      }
    }
  };

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
