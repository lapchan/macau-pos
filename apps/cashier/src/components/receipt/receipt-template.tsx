import type { ReceiptData } from "@/lib/receipt-queries";
import { type Locale, t } from "@/i18n/locales";
import { PAYMENT_METHOD_KEYS } from "@/lib/constants";

function formatDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

export default function ReceiptTemplate({ data, locale = "tc" }: { data: ReceiptData; locale?: Locale }) {
  const cur = data.currency;

  return (
    <div>
      {/* Shop name */}
      <div className="receipt-center receipt-bold receipt-large" style={{ marginBottom: 4 }}>
        {data.shopName}
      </div>

      {/* Address */}
      {data.showAddress && data.shopAddress && (
        <div className="receipt-center receipt-small">{data.shopAddress}</div>
      )}

      {/* Phone */}
      {data.showPhone && data.shopPhone && (
        <div className="receipt-center receipt-small">{data.shopPhone}</div>
      )}

      {/* Double divider */}
      <hr className="receipt-double-divider" />

      {/* Header text */}
      {data.receiptHeader && (
        <>
          <div className="receipt-center receipt-small">{data.receiptHeader}</div>
          <hr className="receipt-divider" />
        </>
      )}

      {/* Order info */}
      <div className="receipt-row">
        <span>{t(locale, "receiptOrder")}: {data.orderNumber}</span>
      </div>
      <div className="receipt-row receipt-small">
        <span>{formatDate(data.orderDate)}</span>
      </div>

      <hr className="receipt-divider" />

      {/* Line items */}
      {data.items.map((item, i) => (
        <div key={i}>
          <div className="receipt-row">
            <span className="receipt-row-left">
              {item.name} x{item.quantity}
            </span>
            <span className="receipt-row-right">
              {cur} {(item.unitPrice * item.quantity).toFixed(2)}
            </span>
          </div>
          {item.variantName && (
            <div className="receipt-small" style={{ paddingLeft: 8, color: "#666" }}>
              · {item.variantName}
            </div>
          )}
          {item.discountAmount > 0 && (
            <div className="receipt-row receipt-small" style={{ paddingLeft: 8, color: "#666" }}>
              <span>{item.discountNote || t(locale, "receiptDiscount")}</span>
              <span className="receipt-row-right">-{cur} {item.discountAmount.toFixed(2)}</span>
            </div>
          )}
        </div>
      ))}

      <hr className="receipt-divider" />

      {/* Subtotal */}
      <div className="receipt-row">
        <span>{t(locale, "receiptSubtotal")}</span>
        <span className="receipt-row-right">{cur} {data.subtotal.toFixed(2)}</span>
      </div>

      {/* Discount */}
      {data.discountAmount > 0 && (
        <div className="receipt-row">
          <span>{data.discountNote || t(locale, "receiptDiscount")}</span>
          <span className="receipt-row-right">-{cur} {data.discountAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Tax */}
      {data.showTax && data.taxAmount > 0 && (
        <div className="receipt-row">
          <span>{t(locale, "receiptTax")} ({data.taxRate}%)</span>
          <span className="receipt-row-right">{cur} {data.taxAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Total */}
      <div className="receipt-row receipt-bold receipt-large" style={{ marginTop: 4 }}>
        <span>{t(locale, "receiptTotal")}</span>
        <span className="receipt-row-right">{cur} {data.total.toFixed(2)}</span>
      </div>

      <hr className="receipt-divider" />

      {/* Payment */}
      <div className="receipt-row">
        <span>{PAYMENT_METHOD_KEYS[data.paymentMethod] ? t(locale, PAYMENT_METHOD_KEYS[data.paymentMethod] as any) : data.paymentMethod}</span>
        <span className="receipt-row-right">{cur} {data.paymentAmount.toFixed(2)}</span>
      </div>

      {/* Cash details */}
      {data.paymentMethod === "cash" && data.cashReceived != null && (
        <>
          <div className="receipt-row receipt-small">
            <span>{t(locale, "receiptCashReceived")}</span>
            <span className="receipt-row-right">{cur} {data.cashReceived.toFixed(2)}</span>
          </div>
          {data.changeGiven != null && data.changeGiven > 0 && (
            <div className="receipt-row receipt-small">
              <span>{t(locale, "receiptChange")}</span>
              <span className="receipt-row-right">{cur} {data.changeGiven.toFixed(2)}</span>
            </div>
          )}
        </>
      )}

      <hr className="receipt-double-divider" />

      {/* Footer */}
      {data.receiptFooter ? (
        <div className="receipt-center receipt-small" style={{ whiteSpace: "pre-wrap" }}>
          {data.receiptFooter}
        </div>
      ) : (
        <div className="receipt-center receipt-small">
          {t(locale, "receiptThankYou")}
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
