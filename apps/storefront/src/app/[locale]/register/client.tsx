"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  locale: string;
  themeId: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function RegisterPageClient({ locale, themeId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState<string>("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [newsletter, setNewsletter] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTerms || !agreePrivacy) {
      setError(t(locale, "請同意條款和隱私政策", "Please agree to the terms and privacy policy", "Aceite os termos", "利用規約に同意してください"));
      return;
    }
    setLoading(true);
    setError(null);
    // TODO: integrate with actual registration API
    setTimeout(() => {
      setLoading(false);
      router.push(`/${locale}/login`);
    }, 1000);
  };

  const EyeIcon = ({ off = false }: { off?: boolean }) => off ? (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  /* ─── HUMAN MADE register page ───
     Matches humanmade.jp/zh_hant/account/register/
     - max-width 376px centered
     - h4 "Create an Account"
     - Last Name + First Name (side by side)
     - Company Name (optional)
     - Gender radio buttons
     - Birthday (optional)
     - Email + Confirm Email
     - Password + Confirm Password
     - Newsletter checkbox
     - Terms scrollable box + agree checkboxes
     - SIGN UP black button + CANCEL outlined button
  */
  return (
    <div className="bg-white min-h-[60vh]">
      <div className="mx-auto py-8 px-4 sm:pt-12 sm:pb-8" style={{ maxWidth: "376px" }}>
        {/* Title */}
        <h4
          className="text-[#121212] mb-2"
          style={{ fontSize: "18px", letterSpacing: "0.05em", lineHeight: "1.4" }}
        >
          {t(locale, "建立帳號", "Create an Account", "Criar Conta", "アカウント作成")}
        </h4>

        {/* Subtitle with login link */}
        <p
          className="text-[#121212]/60 mb-6"
          style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.8" }}
        >
          {t(locale, "已有帳號？", "Already have an account?", "Já tem conta?", "アカウントをお持ちの方")}{" "}
          <a
            href={`/${locale}/login`}
            className="text-[#121212] underline hover:text-[#121212]/70 transition-colors"
          >
            {t(locale, "登入", "Sign In", "Entrar", "ログイン")}
          </a>
        </p>

        {error && (
          <div
            className="mb-4 px-3 py-2 text-[#dc3545] border border-[#dc3545]/20"
            style={{ fontSize: "12px", letterSpacing: "0.04em" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Last Name + First Name — side by side */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label
                htmlFor="reg-lname"
                className="block text-[#121212]/60 mb-1"
                style={{ fontSize: "12px", letterSpacing: "0.05em" }}
              >
                {t(locale, "姓", "Last Name", "Sobrenome", "姓")} *
              </label>
              <input
                id="reg-lname"
                type="text"
                required
                className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212]"
                style={{ fontSize: "14px", letterSpacing: "0.03em" }}
              />
            </div>
            <div>
              <label
                htmlFor="reg-fname"
                className="block text-[#121212]/60 mb-1"
                style={{ fontSize: "12px", letterSpacing: "0.05em" }}
              >
                {t(locale, "名", "First Name", "Nome", "名")} *
              </label>
              <input
                id="reg-fname"
                type="text"
                required
                className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212]"
                style={{ fontSize: "14px", letterSpacing: "0.03em" }}
              />
            </div>
          </div>

          {/* Company Name (optional) */}
          <div className="mb-3">
            <label
              htmlFor="reg-company"
              className="block text-[#121212]/60 mb-1"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "公司名稱（選填）", "Company Name (optional)", "Empresa (opcional)", "会社名（任意）")}
            </label>
            <input
              id="reg-company"
              type="text"
              className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212]"
              style={{ fontSize: "14px", letterSpacing: "0.03em" }}
            />
          </div>

          {/* Gender radio */}
          <div className="mb-4">
            <label
              className="block text-[#121212]/60 mb-2"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "性別", "Gender", "Gênero", "性別")} *
            </label>
            <div className="flex items-center gap-5">
              {[
                { value: "male", label: t(locale, "男", "Male", "Masculino", "男性") },
                { value: "female", label: t(locale, "女", "Female", "Feminino", "女性") },
                { value: "other", label: t(locale, "不透露", "Prefer not to say", "Prefiro não dizer", "回答しない") },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    value={opt.value}
                    checked={gender === opt.value}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="size-4 accent-[#121212]"
                  />
                  <span className="text-[#121212]" style={{ fontSize: "13px", letterSpacing: "0.04em" }}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Birthday (optional) */}
          <div className="mb-3">
            <label
              htmlFor="reg-birthday"
              className="block text-[#121212]/60 mb-1"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "生日（選填）", "Birthday (optional)", "Aniversário (opcional)", "誕生日（任意）")}
            </label>
            <input
              id="reg-birthday"
              type="text"
              placeholder="YYYY/MM/DD"
              className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212] placeholder:text-[#121212]/30"
              style={{ fontSize: "14px", letterSpacing: "0.03em" }}
            />
          </div>

          {/* Email Address */}
          <div className="mb-3">
            <label
              htmlFor="reg-email"
              className="block text-[#121212]/60 mb-1"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "電子郵件", "Email Address", "Email", "メールアドレス")} *
            </label>
            <input
              id="reg-email"
              type="email"
              required
              className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212]"
              style={{ fontSize: "14px", letterSpacing: "0.03em" }}
            />
          </div>

          {/* Confirm Email */}
          <div className="mb-3">
            <label
              htmlFor="reg-email-confirm"
              className="block text-[#121212]/60 mb-1"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "確認電子郵件", "Confirm Email Address", "Confirmar Email", "メールアドレス確認")}
            </label>
            <input
              id="reg-email-confirm"
              type="email"
              className="w-full border-b border-[#121212]/20 bg-transparent py-2 text-[#121212] outline-none transition-colors focus:border-[#121212]"
              style={{ fontSize: "14px", letterSpacing: "0.03em" }}
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label
              htmlFor="reg-password"
              className="block text-[#121212]/60 mb-1"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "密碼", "Password", "Senha", "パスワード")} *
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                required
                className="w-full border-b border-[#121212]/20 bg-transparent py-2 pr-10 text-[#121212] outline-none transition-colors focus:border-[#121212]"
                style={{ fontSize: "14px", letterSpacing: "0.03em" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#121212]/40 hover:text-[#121212]/70 transition-colors"
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label
              htmlFor="reg-password-confirm"
              className="block text-[#121212]/60 mb-1"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "確認密碼", "Confirm Password", "Confirmar Senha", "パスワード確認")} *
            </label>
            <div className="relative">
              <input
                id="reg-password-confirm"
                type={showConfirmPassword ? "text" : "password"}
                required
                className="w-full border-b border-[#121212]/20 bg-transparent py-2 pr-10 text-[#121212] outline-none transition-colors focus:border-[#121212]"
                style={{ fontSize: "14px", letterSpacing: "0.03em" }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-[#121212]/40 hover:text-[#121212]/70 transition-colors"
              >
                <EyeIcon off={showConfirmPassword} />
              </button>
            </div>
          </div>

          {/* Newsletter checkbox */}
          <label className="flex items-start gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 size-4 border border-[#121212]/30 accent-[#121212]"
            />
            <span className="text-[#121212]/70" style={{ fontSize: "12px", letterSpacing: "0.04em", lineHeight: "1.6" }}>
              {t(
                locale,
                "透過電子郵件接收最新產品資訊（選填）",
                "Receive newsletters with the latest product updates via email (optional)",
                "Receber novidades por email (opcional)",
                "メールで最新情報を受け取る（任意）"
              )}
            </span>
          </label>

          {/* Terms of Service — scrollable box */}
          <div className="mb-3">
            <label
              className="block text-[#121212]/60 mb-2"
              style={{ fontSize: "12px", letterSpacing: "0.05em" }}
            >
              {t(locale, "請閱讀服務條款", "Please read the Terms of Service of Use", "Leia os Termos de Uso", "利用規約をお読みください")}
            </label>
            <div
              className="border border-[#121212]/15 p-3 overflow-y-auto text-[#121212]/60"
              style={{ height: "120px", fontSize: "11px", letterSpacing: "0.03em", lineHeight: "1.8" }}
            >
              <p className="font-medium text-[#121212]/80 mb-2">
                {t(locale, "會員註冊服務條款", "New Member Registration Terms of Service of Use", "Termos de Serviço", "新規会員登録利用規約")}
              </p>
              <p className="mb-2">
                {t(
                  locale,
                  "客戶在同意本條款後方可使用會員服務。「會員」是指已同意本條款並按照本公司規定的程序完成註冊的個人。",
                  "Customers may use the Membership Service after agreeing to these Terms. \"Member\" means an individual who has agreed to these Terms and has registered as a member.",
                  "Os clientes podem usar o Serviço de Membros após concordar com estes Termos.",
                  "お客様は本規約に同意の上、会員サービスをご利用いただけます。"
                )}
              </p>
              <p className="mb-2">
                {t(
                  locale,
                  "本公司保留隨時修改本條款的權利，會員同意此點。會員應負責管理和使用會員ID和密碼。",
                  "The Company reserves the right to change these Terms. Members shall be responsible for managing their IDs and passwords.",
                  "A Empresa reserva-se o direito de alterar estes Termos.",
                  "当社は本規約を変更する権利を有します。"
                )}
              </p>
              <p>
                {t(
                  locale,
                  "若會員違反本條款，本公司可暫停或取消其會員資格，且不承擔由此產生的損害賠償責任。",
                  "If a member violates these Terms, the Company may suspend or revoke membership without liability.",
                  "Se um membro violar estes Termos, a Empresa pode suspender a associação.",
                  "会員が本規約に違反した場合、当社は会員資格を停止または取消しできます。"
                )}
              </p>
            </div>
          </div>

          {/* Agree to terms checkbox */}
          <label className="flex items-start gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              required
              className="mt-0.5 size-4 border border-[#121212]/30 accent-[#121212]"
            />
            <span className="text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.04em", lineHeight: "1.6" }}>
              {t(locale, "我同意服務條款", "I agree with the terms of use", "Concordo com os termos", "利用規約に同意する")} *
            </span>
          </label>

          {/* Agree to privacy policy checkbox */}
          <label className="flex items-start gap-2 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={agreePrivacy}
              onChange={(e) => setAgreePrivacy(e.target.checked)}
              required
              className="mt-0.5 size-4 border border-[#121212]/30 accent-[#121212]"
            />
            <span className="text-[#121212]" style={{ fontSize: "12px", letterSpacing: "0.04em", lineHeight: "1.6" }}>
              {t(locale, "我同意", "I agree with the", "Concordo com a", "に同意する")}{" "}
              <a
                href={`/${locale}/privacy-policy`}
                target="_blank"
                className="underline hover:text-[#121212]/70 transition-colors"
              >
                {t(locale, "隱私政策", "privacy policy", "política de privacidade", "プライバシーポリシー")}
              </a> *
            </span>
          </label>

          {/* SIGN UP button — full-width black */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#121212] py-3.5 text-white hover:bg-[#121212]/90 transition-colors disabled:bg-[#121212]/40 disabled:cursor-not-allowed"
            style={{ fontSize: "13px", letterSpacing: "0.15em" }}
          >
            {loading ? "..." : "SIGN UP"}
          </button>

          {/* CANCEL button — full-width outlined */}
          <a
            href={`/${locale}/login`}
            className="mt-3 flex w-full items-center justify-center border border-[#121212] py-3.5 text-[#121212] hover:bg-[#121212] hover:text-white transition-colors"
            style={{ fontSize: "13px", letterSpacing: "0.15em" }}
          >
            CANCEL
          </a>
        </form>
      </div>

      {/* Breadcrumb — bottom, mobile only */}
      <div className="px-4 pb-8 sm:hidden">
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5 text-[#121212]/50" style={{ fontSize: "11px", letterSpacing: "0.06em" }}>
            <li><a href={`/${locale}`} className="hover:text-[#121212] transition-colors">TOP</a></li>
            <li><span className="mx-0.5">›</span></li>
            <li className="text-[#121212]">{t(locale, "建立帳號", "Create an Account", "Criar Conta", "アカウント作成")}</li>
          </ol>
        </nav>
      </div>
    </div>
  );
}
