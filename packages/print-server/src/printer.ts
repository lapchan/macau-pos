/**
 * ESC/POS command builder for thermal receipt printers.
 * Generates raw byte commands that can be sent to any ESC/POS compatible printer.
 */

export type ReceiptData = {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  showAddress: boolean;
  showPhone: boolean;
  showTax: boolean;
  taxRate: number;
  orderNumber: string;
  orderDate: Date;
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    variantName?: string;
  }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  cashReceived?: number;
  changeGiven?: number;
  currency: string;
};

// ESC/POS constants
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: [ESC, 0x40], // Initialize printer
  CENTER: [ESC, 0x61, 0x01], // Center align
  LEFT: [ESC, 0x61, 0x00], // Left align
  RIGHT: [ESC, 0x61, 0x02], // Right align
  BOLD_ON: [ESC, 0x45, 0x01], // Bold on
  BOLD_OFF: [ESC, 0x45, 0x00], // Bold off
  DOUBLE_ON: [GS, 0x21, 0x11], // Double width + height
  DOUBLE_OFF: [GS, 0x21, 0x00], // Normal size
  CUT: [GS, 0x56, 0x42, 0x03], // Partial cut with feed
  FEED: [ESC, 0x64, 0x03], // Feed 3 lines
  LF: [0x0a], // Line feed
};

function textToBytes(text: string): number[] {
  return Array.from(Buffer.from(text, "utf-8"));
}

function line(text: string): number[] {
  return [...textToBytes(text), ...CMD.LF];
}

function padRight(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : text + " ".repeat(width - text.length);
}

function padLeft(text: string, width: number): string {
  return text.length >= width ? text.substring(0, width) : " ".repeat(width - text.length) + text;
}

// Build a 2-column row (left-aligned name, right-aligned price)
function row(left: string, right: string, width = 32): number[] {
  const rightLen = right.length;
  const leftMax = width - rightLen - 1;
  const leftTrimmed = left.length > leftMax ? left.substring(0, leftMax) : left;
  return line(padRight(leftTrimmed, leftMax) + " " + right);
}

function divider(char = "-", width = 32): number[] {
  return line(char.repeat(width));
}

function doubleDivider(width = 32): number[] {
  return line("=".repeat(width));
}

/**
 * Build ESC/POS byte commands for a receipt.
 * Returns a Buffer that can be sent directly to a thermal printer.
 */
export function buildReceiptCommands(data: ReceiptData): Buffer {
  const bytes: number[] = [];
  const cur = data.currency;

  // Initialize
  bytes.push(...CMD.INIT);

  // Shop name (centered, bold, double size)
  bytes.push(...CMD.CENTER, ...CMD.BOLD_ON, ...CMD.DOUBLE_ON);
  bytes.push(...line(data.shopName));
  bytes.push(...CMD.DOUBLE_OFF, ...CMD.BOLD_OFF);

  // Address
  if (data.showAddress && data.shopAddress) {
    bytes.push(...line(data.shopAddress));
  }

  // Phone
  if (data.showPhone && data.shopPhone) {
    bytes.push(...line(data.shopPhone));
  }

  bytes.push(...doubleDivider());

  // Header text
  if (data.receiptHeader) {
    bytes.push(...line(data.receiptHeader));
    bytes.push(...divider());
  }

  // Order info (left-aligned)
  bytes.push(...CMD.LEFT);
  bytes.push(...line(`Order: ${data.orderNumber}`));
  bytes.push(...line(`Date:  ${new Date(data.orderDate).toLocaleString()}`));
  bytes.push(...divider());

  // Line items
  for (const item of data.items) {
    const priceStr = `${cur} ${item.lineTotal.toFixed(2)}`;
    bytes.push(...row(`${item.name} x${item.quantity}`, priceStr));
    if (item.variantName) {
      bytes.push(...line(`  · ${item.variantName}`));
    }
  }

  bytes.push(...divider());

  // Subtotal
  bytes.push(...row("Subtotal", `${cur} ${data.subtotal.toFixed(2)}`));

  // Tax
  if (data.showTax && data.taxAmount > 0) {
    bytes.push(...row(`Tax (${data.taxRate}%)`, `${cur} ${data.taxAmount.toFixed(2)}`));
  }

  // Total (bold, double size)
  bytes.push(...CMD.BOLD_ON, ...CMD.DOUBLE_ON);
  bytes.push(...row("TOTAL", `${cur} ${data.total.toFixed(2)}`, 16));
  bytes.push(...CMD.DOUBLE_OFF, ...CMD.BOLD_OFF);

  bytes.push(...divider());

  // Payment
  const methodLabels: Record<string, string> = {
    cash: "Cash",
    tap: "Card (Tap)",
    insert: "Card (Insert)",
    qr: "QR Pay",
  };
  bytes.push(...row(methodLabels[data.paymentMethod] || data.paymentMethod, `${cur} ${data.paymentAmount.toFixed(2)}`));

  // Cash details
  if (data.paymentMethod === "cash" && data.cashReceived != null) {
    bytes.push(...row("Received", `${cur} ${data.cashReceived.toFixed(2)}`));
    if (data.changeGiven != null && data.changeGiven > 0) {
      bytes.push(...row("Change", `${cur} ${data.changeGiven.toFixed(2)}`));
    }
  }

  bytes.push(...doubleDivider());

  // Footer (centered)
  bytes.push(...CMD.CENTER);
  bytes.push(...line(data.receiptFooter || "Thank you! 多謝光臨！"));

  // Feed and cut
  bytes.push(...CMD.FEED);
  bytes.push(...CMD.CUT);

  return Buffer.from(bytes);
}
