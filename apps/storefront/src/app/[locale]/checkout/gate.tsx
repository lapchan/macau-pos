import { UserIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

type Props = {
  locale: string;
  themeId?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function CheckoutGate({ locale, themeId }: Props) {
  const isHumanMade = themeId === "humanmade";
  const nextUrl = `/${locale}/checkout`;
  const loginHref = `/${locale}/login?next=${encodeURIComponent(nextUrl)}`;
  const guestHref = `/${locale}/checkout?guest=1`;

  const heading = t(locale, "結帳", "Checkout", "Finalizar Compra", "チェックアウト");
  const subheading = t(
    locale,
    "請選擇結帳方式",
    "How would you like to continue?",
    "Como deseja continuar?",
    "お支払い方法を選択してください"
  );
  const loginTitle = t(locale, "會員登入", "Log in", "Entrar", "ログイン");
  const loginDesc = t(
    locale,
    "使用帳號登入以享受快速結帳、訂單追蹤及會員優惠。",
    "Sign in for faster checkout, order tracking, and member benefits.",
    "Entre para checkout rápido, rastreamento e benefícios.",
    "ログインするとスピード決済、注文追跡、会員特典をご利用いただけます。"
  );
  const guestTitle = t(locale, "訪客結帳", "Continue as guest", "Comprar como convidado", "ゲストで購入");
  const guestDesc = t(
    locale,
    "無需註冊帳號即可完成購買。",
    "Check out without creating an account.",
    "Compre sem criar uma conta.",
    "アカウント登録なしでお買い物いただけます。"
  );

  if (isHumanMade) {
    return (
      <div className="bg-white min-h-[60vh]">
        <div className="mx-auto px-4 py-12 sm:py-16" style={{ maxWidth: "480px" }}>
          <h1
            className="text-[#121212] mb-2"
            style={{ fontSize: "20px", letterSpacing: "0.1em", textTransform: "uppercase", lineHeight: 1.4 }}
          >
            {heading}
          </h1>
          <p
            className="text-[#121212]/60 mb-8"
            style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: 1.8 }}
          >
            {subheading}
          </p>

          <a
            href={loginHref}
            className="block w-full bg-[#121212] px-5 py-4 text-center text-white hover:bg-[#333] transition-colors"
            style={{ fontSize: "13px", letterSpacing: "0.15em" }}
          >
            {loginTitle.toUpperCase()}
          </a>
          <p
            className="mt-2 mb-6 text-[#121212]/60"
            style={{ fontSize: "11px", letterSpacing: "0.04em", lineHeight: 1.7 }}
          >
            {loginDesc}
          </p>

          <div className="relative my-6 flex items-center">
            <div className="flex-grow border-t border-[#121212]/15" />
            <span
              className="mx-4 text-[#121212]/50"
              style={{ fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase" }}
            >
              {t(locale, "或", "Or", "Ou", "または")}
            </span>
            <div className="flex-grow border-t border-[#121212]/15" />
          </div>

          <a
            href={guestHref}
            className="flex w-full items-center justify-center border border-[#121212] bg-white px-5 py-4 text-[#121212] hover:bg-[#f5f5f5] transition-colors"
            style={{ fontSize: "13px", letterSpacing: "0.15em" }}
          >
            {guestTitle.toUpperCase()}
          </a>
          <p
            className="mt-2 text-[#121212]/60"
            style={{ fontSize: "11px", letterSpacing: "0.04em", lineHeight: 1.7 }}
          >
            {guestDesc}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">{heading}</h1>
        <p className="mt-2 text-center text-sm text-gray-500">{subheading}</p>

        <div className="mt-8 space-y-3">
          <a
            href={loginHref}
            className="flex w-full items-center justify-between rounded-lg px-5 py-4 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--tenant-accent, #111)" }}
          >
            <span className="flex items-center gap-3">
              <UserIcon className="size-5" />
              {loginTitle}
            </span>
            <ArrowRightIcon className="size-4" />
          </a>
          <p className="px-1 text-xs text-gray-500">{loginDesc}</p>
        </div>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="mx-4 text-xs uppercase tracking-wide text-gray-400">
            {t(locale, "或", "Or", "Ou", "または")}
          </span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <div className="space-y-3">
          <a
            href={guestHref}
            className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-5 py-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <span>{guestTitle}</span>
            <ArrowRightIcon className="size-4" />
          </a>
          <p className="px-1 text-xs text-gray-500">{guestDesc}</p>
        </div>
      </div>
    </div>
  );
}
