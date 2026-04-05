/**
 * OrderHistoryVariants — Tailwind Plus Order History components
 *
 * 4 variants:
 *  - "invoice-panels"     : Card-style panels with order summary
 *  - "invoice-table"      : Table layout with columns
 *  - "invoice-list"       : Simple list with status badges
 *  - "with-actions"       : List with quick action buttons (reorder, track, invoice)
 */

type OrderItem = {
  name: string;
  image?: string | null;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  receiptNo: string;
  createdAt: string;
  status: string;
  total: number;
  itemCount: number;
  items: OrderItem[];
};

type Props = {
  orders: Order[];
  variant?: "invoice-panels" | "invoice-table" | "invoice-list" | "with-actions";
  locale: string;
  currency?: string;
};

const t = (locale: string, tc: string, en: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt: en, ja: en };
  return m[locale] || en;
};

const statusBadge = (status: string, locale: string) => {
  const labels: Record<string, Record<string, string>> = {
    pending: { tc: "待處理", en: "Pending" },
    confirmed: { tc: "已確認", en: "Confirmed" },
    shipped: { tc: "已出貨", en: "Shipped" },
    delivered: { tc: "已送達", en: "Delivered" },
    completed: { tc: "已完成", en: "Completed" },
    cancelled: { tc: "已取消", en: "Cancelled" },
  };
  const colors: Record<string, string> = {
    completed: "bg-green-50 text-green-700",
    delivered: "bg-green-50 text-green-700",
    shipped: "bg-blue-50 text-blue-700",
    confirmed: "bg-blue-50 text-blue-700",
    cancelled: "bg-red-50 text-red-700",
    pending: "bg-yellow-50 text-yellow-700",
  };
  const label = labels[status]?.[locale] || labels[status]?.en || status;
  const color = colors[status] || "bg-gray-50 text-gray-700";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>{label}</span>;
};

function formatDate(date: string, locale: string) {
  return new Date(date).toLocaleDateString(locale === "en" ? "en-US" : "zh-TW", { year: "numeric", month: "short", day: "numeric" });
}

export default function OrderHistoryVariants({ orders, variant = "invoice-list", locale, currency = "MOP" }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">{t(locale, "暫無訂單", "No orders yet")}</p>
      </div>
    );
  }

  // ── Invoice panels ─────────────────────────────────────
  if (variant === "invoice-panels") {
    return (
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex flex-wrap gap-6">
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t(locale, "訂單編號", "Order number")}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{order.receiptNo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t(locale, "日期", "Date placed")}</dt>
                  <dd className="mt-1 text-sm text-gray-500">{formatDate(order.createdAt, locale)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500">{t(locale, "總計", "Total amount")}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{currency} {order.total.toFixed(2)}</dd>
                </div>
              </div>
              {statusBadge(order.status, locale)}
            </div>

            {/* Items */}
            <ul className="divide-y divide-gray-200">
              {order.items.slice(0, 3).map((item, i) => (
                <li key={i} className="flex gap-4 px-6 py-4">
                  <div className="size-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-gray-400 text-xs">{item.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">x{item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{currency} {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </li>
              ))}
            </ul>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-3">
              <a href={`/${locale}/account/orders/${order.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                {t(locale, "查看詳情", "View order")} →
              </a>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Invoice table ──────────────────────────────────────
  if (variant === "invoice-table") {
    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t(locale, "訂單", "Order")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t(locale, "日期", "Date")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t(locale, "狀態", "Status")}</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t(locale, "商品數", "Items")}</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">{t(locale, "總計", "Total")}</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{order.receiptNo}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{formatDate(order.createdAt, locale)}</td>
                <td className="whitespace-nowrap px-6 py-4">{statusBadge(order.status, locale)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.itemCount}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium text-gray-900">{currency} {order.total.toFixed(2)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <a href={`/${locale}/account/orders/${order.id}`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    {t(locale, "查看", "View")}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ── With quick actions ─────────────────────────────────
  if (variant === "with-actions") {
    return (
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Item thumbnails */}
              <div className="flex -space-x-2">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="inline-block size-10 rounded-full border-2 border-white bg-gray-100 overflow-hidden">
                    {item.image ? (
                      <img src={item.image} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="size-full flex items-center justify-center text-gray-400 text-[8px]">{item.name.charAt(0)}</div>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">#{order.receiptNo}</p>
                <p className="text-xs text-gray-500">{formatDate(order.createdAt, locale)} · {order.itemCount} {t(locale, "件", "items")}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {statusBadge(order.status, locale)}
              <span className="text-sm font-medium text-gray-900">{currency} {order.total.toFixed(2)}</span>
              <div className="flex gap-1">
                <a href={`/${locale}/account/orders/${order.id}`} className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                  {t(locale, "查看", "View")}
                </a>
                <button className="rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100">
                  {t(locale, "再次購買", "Reorder")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Invoice list (default) ─────────────────────────────
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <a key={order.id} href={`/${locale}/account/orders/${order.id}`} className="block rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">#{order.receiptNo}</p>
              <p className="mt-1 text-xs text-gray-500">{formatDate(order.createdAt, locale)}</p>
            </div>
            <div className="flex items-center gap-3">
              {statusBadge(order.status, locale)}
              <p className="text-sm font-medium text-gray-900">{currency} {order.total.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 flex -space-x-2">
            {order.items.slice(0, 5).map((item, i) => (
              <div key={i} className="inline-block size-10 rounded-lg border-2 border-white bg-gray-100 overflow-hidden">
                {item.image ? (
                  <img src={item.image} alt="" className="size-full object-cover" />
                ) : (
                  <div className="size-full flex items-center justify-center text-gray-400 text-[8px]">{item.name.charAt(0)}</div>
                )}
              </div>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}
