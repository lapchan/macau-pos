"use client";

import { useEffect, useState } from "react";
import { getOnlinePaymentStatus } from "@/lib/actions/intellipay-status";

type Status = "pending" | "completed" | "refunded" | "voided";

type Props = {
  orderNumber: string;
  initialStatus: Status;
  locale: string;
};

const copy = {
  en: {
    pending: "Waiting for payment confirmation…",
    completed: "Payment received. Thank you!",
    refunded: "This order has been refunded.",
    voided: "This order was cancelled.",
    retry: "Retry payment",
  },
  tc: {
    pending: "等待付款確認中…",
    completed: "付款成功，感謝您的訂購！",
    refunded: "此訂單已退款。",
    voided: "此訂單已取消。",
    retry: "重新付款",
  },
  sc: {
    pending: "等待付款确认中…",
    completed: "付款成功，感谢您的订购！",
    refunded: "此订单已退款。",
    voided: "此订单已取消。",
    retry: "重新付款",
  },
  pt: {
    pending: "A aguardar confirmação do pagamento…",
    completed: "Pagamento recebido. Obrigado!",
    refunded: "Este pedido foi reembolsado.",
    voided: "Este pedido foi cancelado.",
    retry: "Tentar pagar novamente",
  },
  ja: {
    pending: "お支払いの確認を待っています…",
    completed: "お支払いを受け付けました。ありがとうございます！",
    refunded: "この注文は返金されました。",
    voided: "この注文はキャンセルされました。",
    retry: "再度支払う",
  },
} as const;

export default function PaymentStatusBanner({
  orderNumber,
  initialStatus,
  locale,
}: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const l = (copy as unknown as Record<string, typeof copy.en>)[locale] ?? copy.en;

  useEffect(() => {
    if (status !== "pending") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      const res = await getOnlinePaymentStatus(orderNumber);
      if (cancelled) return;
      if (res.success) {
        setStatus(res.data.orderStatus);
        setPaymentUrl(res.data.paymentUrl);
        if (res.data.orderStatus === "pending") {
          timer = setTimeout(poll, 3000);
        }
      } else {
        timer = setTimeout(poll, 5000);
      }
    };

    timer = setTimeout(poll, 2000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [orderNumber, status]);

  const tone =
    status === "completed"
      ? "bg-green-50 text-green-900 border-green-200"
      : status === "pending"
        ? "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          {status === "pending" && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {l[status]}
        </span>
        {status === "voided" && paymentUrl && (
          <a
            href={paymentUrl}
            className="font-medium underline underline-offset-2"
          >
            {l.retry}
          </a>
        )}
      </div>
    </div>
  );
}
