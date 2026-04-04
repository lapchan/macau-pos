import type { ReceiptData } from "@/lib/receipt-queries";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash / 現金",
  tap: "Card (Tap)",
  insert: "Card (Insert)",
  qr: "QR Pay / 掃碼",
};

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

export default function ReceiptTemplate({ data }: { data: ReceiptData }) {
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
        <span>Order: {data.orderNumber}</span>
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
              {cur} {item.lineTotal.toFixed(2)}
            </span>
          </div>
          {item.variantName && (
            <div className="receipt-small" style={{ paddingLeft: 8, color: "#666" }}>
              · {item.variantName}
            </div>
          )}
        </div>
      ))}

      <hr className="receipt-divider" />

      {/* Subtotal */}
      <div className="receipt-row">
        <span>Subtotal</span>
        <span className="receipt-row-right">{cur} {data.subtotal.toFixed(2)}</span>
      </div>

      {/* Tax */}
      {data.showTax && data.taxAmount > 0 && (
        <div className="receipt-row">
          <span>Tax ({data.taxRate}%)</span>
          <span className="receipt-row-right">{cur} {data.taxAmount.toFixed(2)}</span>
        </div>
      )}

      {/* Total */}
      <div className="receipt-row receipt-bold receipt-large" style={{ marginTop: 4 }}>
        <span>TOTAL</span>
        <span className="receipt-row-right">{cur} {data.total.toFixed(2)}</span>
      </div>

      <hr className="receipt-divider" />

      {/* Payment */}
      <div className="receipt-row">
        <span>{METHOD_LABELS[data.paymentMethod] || data.paymentMethod}</span>
        <span className="receipt-row-right">{cur} {data.paymentAmount.toFixed(2)}</span>
      </div>

      {/* Cash details */}
      {data.paymentMethod === "cash" && data.cashReceived != null && (
        <>
          <div className="receipt-row receipt-small">
            <span>Cash received</span>
            <span className="receipt-row-right">{cur} {data.cashReceived.toFixed(2)}</span>
          </div>
          {data.changeGiven != null && data.changeGiven > 0 && (
            <div className="receipt-row receipt-small">
              <span>Change</span>
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
          Thank you! 多謝光臨！
        </div>
      )}

      <div style={{ height: 16 }} />
    </div>
  );
}
