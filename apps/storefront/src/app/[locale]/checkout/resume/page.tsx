import { notFound, redirect } from "next/navigation";
import {
  db,
  orders,
  orderItems,
  payments,
  carts,
  cartItems,
  products,
  getDisplayName,
  eq,
  and,
  sql,
} from "@macau-pos/database";
import { resolveTenant } from "@/lib/tenant-resolver";
import { getCurrentCustomer } from "@/lib/actions/auth";
import { cookies } from "next/headers";
import { resumePayment } from "@/lib/actions/payment-flow";
import { voidPendingOrder } from "@/lib/actions/void-order";
import PaymentCountdown from "@/components/checkout/payment-countdown";

const PENDING_COOKIE = "pending_payment_order";
const PAYMENT_TTL_MINUTES = 20;

type Copy = {
  heading: string;
  subheading: string;
  itemsLabel: string;
  totalLabel: string;
  payNow: string;
  cancel: string;
  cartChangedTitle: string;
  cartChangedBody: string;
  reviewCart: string;
  expiredTitle: string;
  expiredBody: string;
};

const copyByLocale: Record<string, Copy> = {
  en: {
    heading: "Resume your payment",
    subheading: "Your order is waiting — finish paying before the window closes.",
    itemsLabel: "Items",
    totalLabel: "Total",
    payNow: "Pay now",
    cancel: "Cancel order",
    cartChangedTitle: "Your cart has changed",
    cartChangedBody: "The items in your cart no longer match this order. Please review your cart and continue to checkout to create a fresh payment.",
    reviewCart: "Review cart and checkout",
    expiredTitle: "Payment window expired",
    expiredBody: "This order is no longer resumable. Please cancel it and start a new checkout.",
  },
  tc: {
    heading: "繼續付款",
    subheading: "您的訂單仍在等待付款，請在時限內完成。",
    itemsLabel: "商品",
    totalLabel: "總計",
    payNow: "立即付款",
    cancel: "取消訂單",
    cartChangedTitle: "購物車已變更",
    cartChangedBody: "您購物車中的商品與此訂單不一致，請返回結帳頁面以產生新的付款。",
    reviewCart: "重新結帳",
    expiredTitle: "付款時限已過",
    expiredBody: "此訂單已無法繼續付款。請取消後重新下單。",
  },
  sc: {
    heading: "继续付款",
    subheading: "您的订单仍在等待付款，请在时限内完成。",
    itemsLabel: "商品",
    totalLabel: "总计",
    payNow: "立即付款",
    cancel: "取消订单",
    cartChangedTitle: "购物车已变更",
    cartChangedBody: "您购物车中的商品与此订单不一致，请返回结账页面以生成新的付款。",
    reviewCart: "重新结账",
    expiredTitle: "付款时限已过",
    expiredBody: "此订单已无法继续付款。请取消后重新下单。",
  },
  pt: {
    heading: "Retomar pagamento",
    subheading: "O seu pedido está à espera — conclua o pagamento antes que a janela feche.",
    itemsLabel: "Artigos",
    totalLabel: "Total",
    payNow: "Pagar agora",
    cancel: "Cancelar pedido",
    cartChangedTitle: "O seu carrinho mudou",
    cartChangedBody: "Os artigos no carrinho já não correspondem a este pedido. Reveja o carrinho para criar um novo pagamento.",
    reviewCart: "Rever carrinho e finalizar",
    expiredTitle: "Janela de pagamento expirada",
    expiredBody: "Este pedido já não pode ser retomado. Cancele-o e inicie uma nova encomenda.",
  },
  ja: {
    heading: "支払いを続ける",
    subheading: "ご注文はお支払いをお待ちしています。時間内に完了してください。",
    itemsLabel: "商品",
    totalLabel: "合計",
    payNow: "今すぐ支払う",
    cancel: "注文をキャンセル",
    cartChangedTitle: "カートが変更されました",
    cartChangedBody: "カートの商品がこの注文と一致しません。カートを確認し、新しい支払いを作成してください。",
    reviewCart: "カートを確認して決済",
    expiredTitle: "支払い期限切れ",
    expiredBody: "この注文は再開できません。キャンセルして新しい注文をお願いします。",
  },
};

async function findSessionCartId(tenantId: string): Promise<string | null> {
  const customer = await getCurrentCustomer();
  if (customer) {
    const [cart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.tenantId, tenantId), eq(carts.customerId, customer.id)))
      .limit(1);
    if (cart) return cart.id;
  }
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sf_cart_session")?.value;
  if (sessionToken) {
    const [cart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(and(eq(carts.tenantId, tenantId), eq(carts.sessionToken, sessionToken)))
      .limit(1);
    if (cart) return cart.id;
  }
  return null;
}

export default async function ResumePaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const orderNumber = sp.order;
  if (!orderNumber) redirect(`/${locale}`);

  const tenant = await resolveTenant();
  if (!tenant) notFound();

  const [orderRow] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      currency: orders.currency,
      createdAt: orders.createdAt,
      paymentUrl: payments.intellipayPaymentUrl,
    })
    .from(orders)
    .leftJoin(payments, eq(payments.orderId, orders.id))
    .where(
      and(
        eq(orders.tenantId, tenant.id),
        eq(orders.orderNumber, orderNumber!),
        eq(orders.channel, "online"),
      ),
    )
    .limit(1);

  if (!orderRow) redirect(`/${locale}`);
  if (orderRow.status !== "pending" || !orderRow.paymentUrl) {
    const cookieStore = await cookies();
    cookieStore.delete(PENDING_COOKIE);
    redirect(`/${locale}`);
  }

  const orderLines = await db
    .select({
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      quantity: orderItems.quantity,
      name: orderItems.name,
      translations: orderItems.translations,
      unitPrice: orderItems.unitPrice,
      image: products.image,
    })
    .from(orderItems)
    .leftJoin(products, eq(products.id, orderItems.productId))
    .where(eq(orderItems.orderId, orderRow!.id));

  const cartId = await findSessionCartId(tenant.id);
  const cartLines = cartId
    ? await db
        .select({
          productId: cartItems.productId,
          variantId: cartItems.variantId,
          quantity: cartItems.quantity,
        })
        .from(cartItems)
        .where(eq(cartItems.cartId, cartId))
    : [];

  const keyOf = (p: string | null, v: string | null) => `${p ?? ""}|${v ?? ""}`;
  const orderMap = new Map<string, number>();
  for (const l of orderLines) orderMap.set(keyOf(l.productId, l.variantId), l.quantity);
  const cartMap = new Map<string, number>();
  for (const l of cartLines) cartMap.set(keyOf(l.productId, l.variantId), l.quantity);

  const cartMatches =
    cartMap.size === 0 /* empty cart → treat as resume */ ||
    (orderMap.size === cartMap.size &&
      Array.from(orderMap.entries()).every(([k, q]) => cartMap.get(k) === q));

  const expiresAt = new Date(
    new Date(orderRow.createdAt).getTime() + PAYMENT_TTL_MINUTES * 60 * 1000,
  );
  const expired = expiresAt.getTime() <= Date.now();
  const c = copyByLocale[locale] ?? copyByLocale.en;
  const currency = orderRow.currency || "MOP";
  const totalDisplay = `${currency} ${parseFloat(String(orderRow.total)).toFixed(2)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-[var(--radius-md,8px)] border border-slate-200 bg-white p-8 shadow-sm">
        {expired ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <PaymentCountdown expiresAtIso={expiresAt.toISOString()} locale={locale} />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-slate-900">{c.expiredTitle}</h1>
              <p className="text-sm text-slate-600">{c.expiredBody}</p>
            </div>
            <form action={voidPendingOrder}>
              <input type="hidden" name="orderNumber" value={orderRow.orderNumber} />
              <input type="hidden" name="redirectTo" value={`/${locale}`} />
              <button
                type="submit"
                className="rounded-[var(--radius-md,8px)] bg-slate-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                {c.cancel}
              </button>
            </form>
          </div>
        ) : !cartMatches ? (
          <div className="flex flex-col items-center gap-6 text-center">
            <PaymentCountdown expiresAtIso={expiresAt.toISOString()} locale={locale} />
            <div className="space-y-2">
              <h1 className="text-xl font-semibold text-slate-900">{c.cartChangedTitle}</h1>
              <p className="text-sm text-slate-600">{c.cartChangedBody}</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <form action={resumePayment}>
                <input type="hidden" name="orderNumber" value={orderRow.orderNumber} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="rounded-[var(--radius-md,8px)] bg-[var(--tenant-accent,#4f46e5)] px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {c.reviewCart}
                </button>
              </form>
              <form action={voidPendingOrder}>
                <input type="hidden" name="orderNumber" value={orderRow.orderNumber} />
                <input type="hidden" name="redirectTo" value={`/${locale}`} />
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
                >
                  {c.cancel}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <PaymentCountdown expiresAtIso={expiresAt.toISOString()} locale={locale} />
              <div className="space-y-2">
                <h1 className="text-xl font-semibold text-slate-900">{c.heading}</h1>
                <p className="text-sm text-slate-600">{c.subheading}</p>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                {c.itemsLabel}
              </h2>
              <ul className="divide-y divide-slate-100">
                {orderLines.map((line, idx) => {
                  const name = getDisplayName(
                    line.name,
                    (line.translations || {}) as Record<string, string>,
                    locale,
                  );
                  const lineTotal = parseFloat(String(line.unitPrice)) * line.quantity;
                  return (
                    <li key={`${line.productId}-${line.variantId}-${idx}`} className="flex items-center gap-3 py-3">
                      {line.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={line.image}
                          alt={name}
                          loading="lazy"
                          fetchPriority="low"
                          className="h-14 w-14 rounded-[var(--radius-sm,4px)] object-cover"
                        />
                      ) : (
                        <div className="h-14 w-14 rounded-[var(--radius-sm,4px)] bg-slate-100" />
                      )}
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-slate-900">{name}</div>
                        <div className="text-slate-500">× {line.quantity}</div>
                      </div>
                      <div className="text-sm font-medium tabular-nums text-slate-900">
                        {currency} {lineTotal.toFixed(2)}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                <span className="text-sm font-medium text-slate-700">{c.totalLabel}</span>
                <span className="text-lg font-semibold tabular-nums text-slate-900">{totalDisplay}</span>
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3">
              <form action={resumePayment}>
                <input type="hidden" name="orderNumber" value={orderRow.orderNumber} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="w-full rounded-[var(--radius-md,8px)] bg-[var(--tenant-accent,#4f46e5)] px-6 py-3 text-base font-semibold text-white transition hover:opacity-90"
                >
                  {c.payNow}
                </button>
              </form>
              <form action={voidPendingOrder} className="flex justify-center">
                <input type="hidden" name="orderNumber" value={orderRow.orderNumber} />
                <input type="hidden" name="redirectTo" value={`/${locale}`} />
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-600 underline-offset-2 hover:underline"
                >
                  {c.cancel}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
