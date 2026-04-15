import { redirect } from "next/navigation";
import { lookupOrder } from "@/lib/actions/order-lookup";

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function OrderLookupPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;

  async function handleLookup(formData: FormData) {
    "use server";
    const result = await lookupOrder(formData);
    const lc = String(formData.get("locale") || "en");
    if (result.success) {
      redirect(`/${lc}/checkout/confirmation?order=${result.orderNumber}`);
    }
    redirect(`/${lc}/orders/lookup?error=${encodeURIComponent(result.error)}`);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-[var(--radius-md,8px)] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {t(locale, "查詢訂單", "Look up your order", "Procurar pedido", "注文を検索")}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {t(
            locale,
            "輸入訂單編號和您結帳時使用的電話號碼。",
            "Enter your order number and the phone number you used at checkout.",
            "Introduza o número do pedido e o telefone que usou na finalização.",
            "ご注文番号と購入時に使用した電話番号を入力してください。",
          )}
        </p>

        {sp.error && (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {sp.error}
          </div>
        )}

        <form action={handleLookup} className="mt-6 space-y-4">
          <input type="hidden" name="locale" value={locale} />
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {t(locale, "訂單編號", "Order number", "Número do pedido", "注文番号")}
            </label>
            <input
              type="text"
              name="orderNumber"
              required
              autoComplete="off"
              placeholder="OD…"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              {t(locale, "電話號碼", "Phone number", "Telefone", "電話番号")}
            </label>
            <input
              type="tel"
              name="phone"
              required
              autoComplete="tel"
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t(locale, "查詢", "Find my order", "Procurar", "検索")}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t(locale, "已有帳戶？", "Have an account?", "Tem uma conta?", "アカウントをお持ちですか？")}{" "}
          <a href={`/${locale}/login`} className="font-medium text-slate-700 underline">
            {t(locale, "登入查看", "Sign in to see all your orders", "Inicie sessão", "ログイン")}
          </a>
        </p>
      </div>
    </div>
  );
}
