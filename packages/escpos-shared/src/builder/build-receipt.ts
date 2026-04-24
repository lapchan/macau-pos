import type { BuildOptions, ReceiptInput, ReceiptLocale } from "../types.js";
import { getDriver } from "../drivers/index.js";
import { getCodePage } from "../codepages/index.js";
import {
  concat,
  divider,
  encodeBlock,
  encodeLine,
  selectCodePageBytes,
  twoColRow,
  visualWidth,
  padRight,
  wrapToWidth,
} from "./commands.js";

const THANK_YOU: Record<ReceiptLocale, string> = {
  en: "Thank you!",
  tc: "多謝光臨！",
  sc: "感谢光临！",
  pt: "Obrigado!",
  ja: "ありがとうございました",
};

type Labels = {
  order: string;
  date: string;
  staff: string;
  subtotal: string;
  discount: string;
  tax: string;
  total: string;
  received: string;
  change: string;
};

const LABELS: Record<ReceiptLocale, Labels> = {
  en: {
    order: "Order",
    date: "Date",
    staff: "Staff",
    subtotal: "Subtotal",
    discount: "Discount",
    tax: "Tax",
    total: "TOTAL",
    received: "Received",
    change: "Change",
  },
  tc: {
    order: "單號",
    date: "日期",
    staff: "收銀員",
    subtotal: "小計",
    discount: "折扣",
    tax: "稅金",
    total: "合計",
    received: "收到",
    change: "找續",
  },
  sc: {
    order: "单号",
    date: "日期",
    staff: "收银员",
    subtotal: "小计",
    discount: "折扣",
    tax: "税金",
    total: "合计",
    received: "收到",
    change: "找零",
  },
  pt: {
    order: "Pedido",
    date: "Data",
    staff: "Atendente",
    subtotal: "Subtotal",
    discount: "Desconto",
    tax: "Imposto",
    total: "TOTAL",
    received: "Recebido",
    change: "Troco",
  },
  ja: {
    order: "注文番号",
    date: "日付",
    staff: "レジ係",
    subtotal: "小計",
    discount: "値引",
    tax: "税金",
    total: "合計",
    received: "お預かり",
    change: "お釣り",
  },
};

const PAYMENT_KEY: Record<ReceiptLocale, Record<string, string>> = {
  en: {
    cash: "Cash", tap: "Card (Tap)", insert: "Card (Insert)",
    qr: "QR Pay", mpm: "QR Pay", cpm: "Wallet Scan",
  },
  tc: {
    cash: "現金", tap: "信用卡（拍卡）", insert: "信用卡（插卡）",
    qr: "二維碼支付", mpm: "二維碼支付", cpm: "錢包掃碼",
  },
  sc: {
    cash: "现金", tap: "信用卡（拍卡）", insert: "信用卡（插卡）",
    qr: "二维码支付", mpm: "二维码支付", cpm: "钱包扫码",
  },
  pt: {
    cash: "Dinheiro", tap: "Cartão (Contactless)", insert: "Cartão (Inserir)",
    qr: "Pagamento QR", mpm: "Pagamento QR", cpm: "Carteira",
  },
  ja: {
    cash: "現金", tap: "カード（タッチ）", insert: "カード（挿入）",
    qr: "QR決済", mpm: "QR決済", cpm: "ウォレット",
  },
};

// Amounts are decimal units of the tenant's currency (e.g. 387.00 = MOP 387).
// The POS database stores money in numeric(10,2) columns — not cents. Callers
// on older code paths that still pass cents should scale before calling.
function fmtMoney(amount: number, currency: string): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}${currency} ${abs.toFixed(2)}`;
}

function fmtTimestamp(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function buildReceipt(opts: BuildOptions, input: ReceiptInput): Uint8Array {
  const driver = getDriver(opts.driver);
  const cp = getCodePage(opts.codePage);
  const cols = driver.columns(opts.paperWidth);
  const lbl = LABELS[input.locale];
  const payments = PAYMENT_KEY[input.locale];
  const parts: Uint8Array[] = [];

  parts.push(driver.init());
  parts.push(selectCodePageBytes(driver, cp));

  // ── Header ─────────────────────────────────────────
  parts.push(driver.align("center"));
  parts.push(driver.emphasis(true));
  parts.push(driver.doubleSize(true));
  // Shop name uses double-width glyphs, so it fits roughly half the columns.
  for (const line of wrapToWidth(input.shopName, Math.floor(cols / 2))) {
    parts.push(encodeLine(line, cp));
  }
  parts.push(driver.doubleSize(false));
  parts.push(driver.emphasis(false));
  if (input.shopAddress) {
    for (const chunk of input.shopAddress.split("\n")) {
      for (const line of wrapToWidth(chunk, cols)) {
        parts.push(encodeLine(line, cp));
      }
    }
  }
  if (input.shopPhone) parts.push(encodeLine(input.shopPhone, cp));
  parts.push(encodeLine(divider("=", cols), cp));

  // ── Order info ─────────────────────────────────────
  parts.push(driver.align("left"));
  parts.push(encodeLine(`${lbl.order}: ${input.orderNumber}`, cp));
  parts.push(encodeLine(`${lbl.date}:  ${fmtTimestamp(input.timestamp)}`, cp));
  if (input.cashierName) {
    parts.push(encodeLine(`${lbl.staff}: ${input.cashierName}`, cp));
  }
  parts.push(encodeLine(divider("-", cols), cp));

  // ── Items ──────────────────────────────────────────
  // Bold item lines — emphasizes what customers scan for.
  parts.push(driver.emphasis(true));
  for (const item of input.items) {
    const left = `${item.name} x${item.quantity}`;
    const right = fmtMoney(item.lineTotal, input.currency);
    parts.push(encodeBlock(twoColRow(left, right, cols), cp));
    if (item.discount) {
      parts.push(encodeLine(`  ${item.discount}`, cp));
    }
  }
  parts.push(driver.emphasis(false));
  parts.push(encodeLine(divider("-", cols), cp));

  // ── Totals ─────────────────────────────────────────
  parts.push(
    encodeBlock(
      twoColRow(lbl.subtotal, fmtMoney(input.subtotal, input.currency), cols),
      cp,
    ),
  );
  if (input.discountAmount && input.discountAmount > 0) {
    parts.push(
      encodeBlock(
        twoColRow(
          lbl.discount,
          fmtMoney(-input.discountAmount, input.currency),
          cols,
        ),
        cp,
      ),
    );
  }
  if (input.taxAmount && input.taxAmount > 0) {
    parts.push(
      encodeBlock(
        twoColRow(lbl.tax, fmtMoney(input.taxAmount, input.currency), cols),
        cp,
      ),
    );
  }

  // TOTAL — bold + double-size, narrower column for visibility.
  parts.push(driver.emphasis(true));
  parts.push(driver.doubleSize(true));
  const totalCols = Math.floor(cols / 2);
  parts.push(
    encodeBlock(
      twoColRow(lbl.total, fmtMoney(input.total, input.currency), totalCols),
      cp,
    ),
  );
  parts.push(driver.doubleSize(false));
  parts.push(driver.emphasis(false));
  parts.push(encodeLine(divider("-", cols), cp));

  // ── Payment ────────────────────────────────────────
  const methodLabel = payments[input.paymentMethod] ?? input.paymentMethod;
  parts.push(
    encodeBlock(
      twoColRow(methodLabel, fmtMoney(input.total, input.currency), cols),
      cp,
    ),
  );
  if (input.paymentMethod === "cash") {
    if (input.cashReceived != null) {
      parts.push(
        encodeBlock(
          twoColRow(
            lbl.received,
            fmtMoney(input.cashReceived, input.currency),
            cols,
          ),
          cp,
        ),
      );
    }
    if (input.change != null && input.change > 0) {
      parts.push(
        encodeBlock(
          twoColRow(lbl.change, fmtMoney(input.change, input.currency), cols),
          cp,
        ),
      );
    }
  }
  parts.push(encodeLine(divider("=", cols), cp));

  // ── Footer ─────────────────────────────────────────
  parts.push(driver.align("center"));
  parts.push(driver.emphasis(true));
  const footerText = input.footer ?? THANK_YOU[input.locale];
  // Center within the column width for nicer rendering on printers that don't
  // honor ESC a 1 (rare but cheap firmware exists). Wrap first so long
  // shop-configured footers don't clip.
  for (const line of wrapToWidth(footerText, cols)) {
    parts.push(encodeLine(padRight(centerText(line, cols), cols), cp));
  }
  parts.push(driver.emphasis(false));

  // ── Tail ───────────────────────────────────────────
  // feed(5) instead of feed(3) so the cut blade — which clips ~10mm above
  // the current head position on most thermal printers — doesn't eat the
  // last line of the footer.
  parts.push(driver.feed(5));
  if (opts.kickDrawer) {
    parts.push(driver.kickDrawer());
  }
  parts.push(driver.cut("partial"));

  return concat(...parts);
}

function centerText(text: string, width: number): string {
  const w = visualWidth(text);
  if (w >= width) return text;
  const pad = Math.floor((width - w) / 2);
  return " ".repeat(pad) + text;
}
