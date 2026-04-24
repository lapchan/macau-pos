export type PrinterDriver = "generic" | "star" | "epson" | "custom";
export type PrinterCodePage = "cp437" | "gb18030" | "big5" | "shift_jis";
export type PaperWidth = 58 | 80;
export type ReceiptLocale = "tc" | "sc" | "en" | "pt" | "ja";

export interface BuildOptions {
  driver: PrinterDriver;
  paperWidth: PaperWidth;
  codePage: PrinterCodePage;
  kickDrawer?: boolean;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: string;
  lineTotal: number;
}

export interface ReceiptInput {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  orderNumber: string;
  timestamp: Date;
  cashierName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  change?: number;
  footer?: string;
  currency: string;
  locale: ReceiptLocale;
}

export interface TestPageInput {
  shopName: string;
  locationName: string;
  timestamp: Date;
  driver: PrinterDriver;
  paperWidth: PaperWidth;
  codePage: PrinterCodePage;
}
