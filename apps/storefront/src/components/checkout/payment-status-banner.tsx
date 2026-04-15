"use client";

import { useEffect, useState } from "react";
import { getOnlinePaymentStatus } from "@/lib/actions/intellipay-status";

type Status = "pending" | "completed" | "refunded" | "voided";

type Props = {
  orderNumber: string;
  initialStatus: Status;
  locale: string;
};

const POLL_INTERVAL_MS = 3000;
const ERROR_BACKOFF_MS = 5000;
const ERROR_THRESHOLD = 3;

const copy = {
  en: {
    pending: "Waiting for payment confirmation…",
    completed: "Payment received. Thank you!",
    refunded: "This order has been refunded.",
    voided: "This order was cancelled.",
    retry: "Retry payment",
    error: "Couldn't reach payment service. ",
    refresh: "Refresh",
  },
  tc: {
    pending: "等待付款確認中…",
    completed: "付款成功，感謝您的訂購！",
    refunded: "此訂單已退款。",
    voided: "此訂單已取消。",
    retry: "重新付款",
    error: "無法連接付款服務。 ",
    refresh: "重新整理",
  },
  sc: {
    pending: "等待付款确认中…",
    completed: "付款成功，感谢您的订购！",
    refunded: "此订单已退款。",
    voided: "此订单已取消。",
    retry: "重新付款",
    error: "无法连接付款服务。 ",
    refresh: "刷新",
  },
  pt: {
    pending: "A aguardar confirmação do pagamento…",
    completed: "Pagamento recebido. Obrigado!",
    refunded: "Este pedido foi reembolsado.",
    voided: "Este pedido foi cancelado.",
    retry: "Tentar pagar novamente",
    error: "Não foi possível contactar o serviço de pagamento. ",
    refresh: "Atualizar",
  },
  ja: {
    pending: "お支払いの確認を待っています…",
    completed: "お支払いを受け付けました。ありがとうございます！",
    refunded: "この注文は返金されました。",
    voided: "この注文はキャンセルされました。",
    retry: "再度支払う",
    error: "決済サービスに接続できませんでした。 ",
    refresh: "更新",
  },
} as const;

export default function PaymentStatusBanner({
  orderNumber,
  initialStatus,
  locale,
}: Props) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [errored, setErrored] = useState(false);
  const l =
    (copy as unknown as Record<string, typeof copy.en>)[locale] ?? copy.en;

  useEffect(() => {
    if (status !== "pending") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let consecutiveErrors = 0;

    const schedule = (ms: number) => {
      if (cancelled) return;
      timer = setTimeout(tick, ms);
    };

    const tick = async () => {
      if (cancelled) return;
      // Pause when the tab is hidden — we'll resume on visibilitychange.
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      try {
        const res = await getOnlinePaymentStatus(orderNumber);
        if (cancelled) return;
        if (res.success) {
          consecutiveErrors = 0;
          setErrored(false);
          setStatus(res.data.orderStatus);
          if (res.data.orderStatus === "pending") schedule(POLL_INTERVAL_MS);
        } else {
          throw new Error(res.error);
        }
      } catch {
        if (cancelled) return;
        consecutiveErrors += 1;
        if (consecutiveErrors >= ERROR_THRESHOLD) {
          setErrored(true);
        }
        schedule(ERROR_BACKOFF_MS);
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled && status === "pending") {
        if (timer) clearTimeout(timer);
        tick();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    // Poll immediately on mount — no 2s grace delay.
    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [orderNumber, status]);

  const tone =
    status === "completed"
      ? "bg-green-50 text-green-900 border-green-200"
      : status === "pending"
        ? errored
          ? "bg-rose-50 text-rose-900 border-rose-200"
          : "bg-amber-50 text-amber-900 border-amber-200"
        : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${tone}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          {status === "pending" && !errored && (
            <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
          )}
          {status === "pending" && errored ? l.error : l[status]}
          {status === "pending" && errored && (
            <button
              type="button"
              onClick={() => {
                setErrored(false);
                // Force a re-run by toggling status (set then back)
                if (typeof window !== "undefined") window.location.reload();
              }}
              className="font-medium underline underline-offset-2"
            >
              {l.refresh}
            </button>
          )}
        </span>
        {status === "voided" && (
          <a
            href={`/${locale}/checkout/resume?order=${orderNumber}`}
            className="font-medium underline underline-offset-2"
          >
            {l.retry}
          </a>
        )}
      </div>
    </div>
  );
}
