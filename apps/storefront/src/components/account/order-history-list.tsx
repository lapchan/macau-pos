import Image from "next/image";

type OrderSummary = {
  id: string;
  receiptNo: string;
  createdAt: string;
  status: string;
  total: number;
  itemCount: number;
  items: {
    name: string;
    image?: string | null;
    quantity: number;
    price: number;
  }[];
};

type Props = {
  orders: OrderSummary[];
  locale: string;
  currency?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

const statusLabel = (status: string, locale: string) => {
  const map: Record<string, Record<string, string>> = {
    pending: { tc: "待處理", en: "Pending", pt: "Pendente", ja: "保留中" },
    confirmed: { tc: "已確認", en: "Confirmed", pt: "Confirmado", ja: "確認済み" },
    preparing: { tc: "準備中", en: "Preparing", pt: "Preparando", ja: "準備中" },
    shipped: { tc: "已出貨", en: "Shipped", pt: "Enviado", ja: "発送済み" },
    delivered: { tc: "已送達", en: "Delivered", pt: "Entregue", ja: "配達済み" },
    completed: { tc: "已完成", en: "Completed", pt: "Concluído", ja: "完了" },
    cancelled: { tc: "已取消", en: "Cancelled", pt: "Cancelado", ja: "キャンセル" },
  };
  return map[status]?.[locale] || map[status]?.en || status;
};

const statusColor = (status: string) => {
  switch (status) {
    case "completed":
    case "delivered": return "bg-green-50 text-green-700 ring-green-600/10";
    case "shipped":
    case "preparing": return "bg-blue-50 text-blue-700 ring-blue-600/10";
    case "cancelled": return "bg-red-50 text-red-700 ring-red-600/10";
    default: return "bg-yellow-50 text-yellow-700 ring-yellow-600/10";
  }
};

export default function OrderHistoryList({ orders, locale, currency = "MOP" }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto text-gray-300">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
        </svg>
        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          {t(locale, "暫無訂單", "No orders yet", "Nenhum pedido ainda", "注文はまだありません")}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t(locale, "您的訂單紀錄會顯示在這裡。", "Your order history will appear here.", "Seu histórico de pedidos aparecerá aqui.", "注文履歴はここに表示されます。")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {orders.map((order) => (
        <div key={order.id} className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* Order header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {t(locale, "訂單編號", "Order", "Pedido", "注文")} #{order.receiptNo}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString(locale === "en" ? "en-US" : locale === "pt" ? "pt-MO" : locale === "ja" ? "ja-JP" : "zh-TW", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className={`mt-2 sm:mt-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusColor(order.status)}`}>
                {statusLabel(order.status, locale)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currency} {order.total.toFixed(2)}</p>
              <p className="mt-1 text-xs text-gray-500">
                {order.itemCount} {t(locale, "件商品", "items", "itens", "アイテム")}
              </p>
            </div>
          </div>

          {/* Order items preview */}
          <div className="px-4 py-4 sm:px-6">
            <div className="flex -space-x-2 overflow-hidden">
              {order.items.slice(0, 5).map((item, i) => (
                <div key={i} className="relative inline-block size-12 rounded-lg border-2 border-white bg-gray-100 overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center text-gray-400 text-[8px] font-bold">
                      {item.name.charAt(0)}
                    </div>
                  )}
                </div>
              ))}
              {order.items.length > 5 && (
                <div className="inline-flex size-12 items-center justify-center rounded-lg border-2 border-white bg-gray-100 text-xs font-medium text-gray-500">
                  +{order.items.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <a
              href={`/${locale}/account/orders/${order.id}`}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t(locale, "查看訂單", "View order", "Ver pedido", "注文を見る")}
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
