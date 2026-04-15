import { cookies } from "next/headers";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getCurrentCustomer } from "@/lib/actions/auth";
import { getPendingOnlineOrder } from "@/lib/storefront-queries";
import { voidPendingOrder } from "@/lib/actions/void-order";

const PENDING_COOKIE = "pending_payment_order";

type Copy = {
  heading: string;
  resume: string;
  cancel: string;
  orderLabel: string;
};

const copyByLocale: Record<string, Copy> = {
  en: {
    heading: "You have an unpaid order",
    resume: "Resume payment",
    cancel: "Cancel",
    orderLabel: "Order",
  },
  tc: {
    heading: "您有一筆未完成付款的訂單",
    resume: "繼續付款",
    cancel: "取消",
    orderLabel: "訂單",
  },
  sc: {
    heading: "您有一笔未完成付款的订单",
    resume: "继续付款",
    cancel: "取消",
    orderLabel: "订单",
  },
  pt: {
    heading: "Tem um pedido por pagar",
    resume: "Retomar pagamento",
    cancel: "Cancelar",
    orderLabel: "Pedido",
  },
  ja: {
    heading: "未払いの注文があります",
    resume: "支払いを続ける",
    cancel: "キャンセル",
    orderLabel: "注文",
  },
};

export default async function PendingPaymentBar({ locale }: { locale: string }) {
  const tenant = await resolveTenant();
  if (!tenant) return null;

  const customer = await getCurrentCustomer();
  const cookieStore = await cookies();
  const cookieOrderNumber = cookieStore.get(PENDING_COOKIE)?.value ?? null;

  const pending = await getPendingOnlineOrder({
    tenantId: tenant.id,
    customerId: customer?.id ?? null,
    orderNumber: cookieOrderNumber,
  });

  if (!pending) return null;

  const c = copyByLocale[locale] ?? copyByLocale.en;
  const currency = pending.currency || "MOP";
  const totalDisplay = `${currency} ${parseFloat(String(pending.total)).toFixed(2)}`;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white">
      <span className="flex items-center gap-2">
        <svg className="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
        </svg>
        <span>
          {c.heading} — {c.orderLabel} {pending.orderNumber} · {totalDisplay}
        </span>
      </span>
      <span className="flex items-center gap-3">
        <a
          href={`/${locale}/checkout/resume?order=${pending.orderNumber}`}
          className="inline-flex items-center gap-1 rounded-md bg-white/95 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-white"
        >
          {c.resume}
          <svg className="size-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        </a>
        <form action={voidPendingOrder}>
          <input type="hidden" name="orderNumber" value={pending.orderNumber} />
          <input type="hidden" name="redirectTo" value={`/${locale}`} />
          <button
            type="submit"
            className="text-xs font-medium text-white/90 underline-offset-2 hover:underline"
          >
            {c.cancel}
          </button>
        </form>
      </span>
    </div>
  );
}
