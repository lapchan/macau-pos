# Plan: Receipt Printing (Browser Print + ESC/POS Print Server)

## Context
The cashier checkout success screen has disabled "Print Receipt" and "Email Receipt" buttons. Order history has no print option. Receipt settings (header, footer, toggles) already exist in admin Settings. This plan adds **two print methods**:
1. **Browser print** — `window.print()` for any device (iPad AirPrint, desktop, Bluetooth)
2. **ESC/POS print server** — Node.js local server for direct thermal printer auto-print (no dialog)

## Architecture

| Decision | Choice | Why |
|---|---|---|
| Browser print | `window.print()` + `@media print` CSS | Zero deps, works everywhere, iPad AirPrint |
| ESC/POS print | Node.js print server (`packages/print-server`) | USB/network thermal printers, auto-print |
| ESC/POS library | `escpos` npm package | Mature, supports Epson/Star/generic ESC/POS |
| Receipt component | Shared `<ReceiptTemplate>` for browser | One component, consistent output |
| Print server comm | HTTP POST to `http://localhost:9100/print` | Simple REST, no WebSocket needed |
| Settings | Admin configures print server URL + mode | Per-terminal: browser, esc-pos, or both |
| Paper size | 80mm (standard thermal) | CSS `@page { size: 80mm auto; }` for browser |

---

## New Files (3)

### 1. `apps/cashier/src/components/receipt/receipt-template.tsx`
The core receipt HTML component. Styled for thermal printer paper (80mm wide).

**Sections:**
- Shop name (large, centered, bold)
- Shop address (if receipt setting enabled)
- Shop phone (if receipt setting enabled)
- Receipt header text (custom)
- Divider line (dashes)
- Order number + date/time
- Divider
- Line items: name × qty → price (right-aligned)
  - Variant info shown in smaller text below item name
- Divider
- Subtotal
- Tax (if receipt setting enabled, using tax rate from settings)
- **Total** (large, bold)
- Payment method + amount
- Cash received + change (cash only)
- Divider
- Receipt footer text (custom)
- "Thank you!" / localized

**Props:**
```typescript
type ReceiptData = {
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
  items: { name: string; nameCn?: string; quantity: number; unitPrice: number; lineTotal: number; variantName?: string }[];
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentAmount: number;
  cashReceived?: number;
  changeGiven?: number;
  currency: string;
};
```

**Styling:**
- Monospace font (`Courier New`, `monospace`)
- Fixed width: 80mm (302px at 96dpi)
- No colors — pure black on white
- Dashed dividers instead of `<hr>`
- All text sizes optimized for thermal print

### 2. `apps/cashier/src/components/receipt/print-receipt.tsx`
A wrapper that renders `ReceiptTemplate` in a hidden div and triggers `window.print()`.

**Approach:**
- Render receipt into a hidden `<div>` with `display:none`
- On "Print" click: temporarily show the div, call `window.print()`, then hide again
- Use `@media print` CSS to hide everything except the receipt
- After print dialog closes (`onafterprint`), restore visibility

### 3. `apps/cashier/src/lib/receipt-queries.ts`
Server-side function to fetch all data needed for a receipt.

```typescript
"use server"
export async function getReceiptData(orderNumber: string): Promise<ReceiptData>
```
- Fetches order + order items + payment from DB
- Fetches shop settings (name, address, phone, receipt config)
- Returns combined `ReceiptData` object
- Tenant-scoped via session

---

## Modified Files (4)

### 4. `apps/cashier/src/components/checkout/checkout-modal.tsx`
- Enable "Print Receipt" button (remove disabled state)
- On click: fetch receipt data → trigger print
- Pass cart data to receipt component (already available in success state)

### 5. `apps/cashier/src/app/history/history-client.tsx`
- Add "Print" button on each order row (Printer icon)
- On click: fetch receipt data by order number → trigger print

### 6. `apps/cashier/src/app/globals.css`
- Add `@media print` styles:
  - Hide everything except `.receipt-print-area`
  - Set page size to 80mm width
  - Remove margins and padding
  - Force monospace font

### 7. `apps/cashier/src/i18n/locales.ts`
- Add ~10 new receipt-related keys × 5 locales:
  - `receipt.orderNumber`, `receipt.date`, `receipt.subtotal`, `receipt.tax`
  - `receipt.total`, `receipt.paymentMethod`, `receipt.cashReceived`, `receipt.change`
  - `receipt.thankYou`, `receipt.reprint`

---

## Print Flow

### From Checkout Success:
```
1. Cashier completes payment → success screen shows
2. Taps "Print Receipt"
3. Receipt data already available (cart + order number + settings)
4. Hidden receipt div rendered with ReceiptTemplate
5. window.print() opens native print dialog
6. User selects printer → prints
7. Receipt div hides again
```

### From Order History:
```
1. Cashier navigates to order history
2. Taps print icon on an order row
3. getReceiptData(orderNumber) fetches from DB
4. Receipt rendered in hidden div
5. window.print() triggers
6. Prints the receipt
```

---

## Receipt Layout (80mm thermal)

```
================================
       CountingStars
  澳門罅些喇提督大馬路162-166號
       +853 6800 0000
================================
    Welcome to our store!
--------------------------------
Order: CS-260324-0001
Date:  2026-03-24 14:30:22
--------------------------------
SAVEWO 3DMASK Kuro     x1
  · 暗魂黑 DarkSoul M        $149.00
Vita Lemon Tea 250ml   x2
                              $13.00
--------------------------------
Subtotal              MOP 162.00
Total                 MOP 162.00
--------------------------------
Payment: Card (Tap)
Amount:               MOP 162.00
================================
     Thank you! 多謝光臨！
================================
```

---

## ESC/POS Print Server (`packages/print-server/`)

### New Package: `packages/print-server`
A standalone Node.js process that receives print jobs via HTTP and sends ESC/POS commands to a USB/network thermal printer.

**Dependencies:** `escpos`, `escpos-usb`, `escpos-network`, `express`, `cors`

### Files:
- `packages/print-server/src/server.ts` — Express server on port 9100
- `packages/print-server/src/printer.ts` — ESC/POS command builder
- `packages/print-server/src/config.ts` — Printer configuration (USB/network, vid:pid)
- `packages/print-server/package.json` — Dependencies
- `packages/print-server/README.md` — Setup instructions

### API:
```
POST http://localhost:9100/print
Content-Type: application/json
Body: ReceiptData (same shape as browser receipt)

Response: { success: true } or { success: false, error: "..." }

GET http://localhost:9100/status
Response: { connected: true, printer: "Epson TM-T82" }
```

### ESC/POS Command Flow:
```
1. Receive ReceiptData JSON
2. Build ESC/POS commands:
   - Initialize printer (ESC @)
   - Center align (ESC a 1)
   - Bold shop name (ESC E 1)
   - Normal text for address/phone
   - Left align items
   - Right align prices (using column formatting)
   - Bold total
   - Cut paper (GS V 66 3)
3. Send to printer via USB or network
4. Return success/failure
```

### Cashier Integration:
- New setting in admin Settings → Receipt tab: "Print Server URL" (default: `http://localhost:9100`)
- New setting: "Print Mode" dropdown: Browser / ESC/POS / Both
- Cashier reads print mode from shop settings
- If ESC/POS: POST to print server URL instead of window.print()
- If Both: browser print + ESC/POS in parallel

---

## Modified Files (Additional for ESC/POS)

### 8. `packages/database/src/schema/shop-settings.ts`
- Add `printMode` column: `text("print_mode").default("browser")` — "browser" | "escpos" | "both"
- Add `printServerUrl` column: `text("print_server_url").default("http://localhost:9100")`

### 9. `apps/admin/src/app/(dashboard)/settings/settings-client.tsx`
- Add "Print Server" section to Receipt tab:
  - Print Mode dropdown (Browser / ESC/POS / Both)
  - Print Server URL input (shown when ESC/POS selected)
  - "Test Print" button → sends test page to print server

---

## Build Order

| Step | Task | Files |
|------|------|-------|
| **Browser Print** | | |
| 1 | Add `@media print` CSS | `globals.css` |
| 2 | Add i18n keys (~10 keys × 5 locales) | `locales.ts` |
| 3 | Create `getReceiptData` query | `receipt-queries.ts` |
| 4 | Create `ReceiptTemplate` component | `receipt-template.tsx` |
| 5 | Create `PrintReceipt` wrapper | `print-receipt.tsx` |
| 6 | Wire into checkout modal | `checkout-modal.tsx` |
| 7 | Wire into order history | `history-client.tsx` |
| **ESC/POS Print Server** | | |
| 8 | Add print settings to DB schema | `shop-settings.ts` |
| 9 | Run migration | `db:generate` + `db:migrate` |
| 10 | Create print server package | `packages/print-server/` |
| 11 | Add print mode to admin Settings | `settings-client.tsx` |
| 12 | Add ESC/POS fallback in cashier | `print-receipt.tsx` |

---

## Verification

1. Complete a checkout in cashier → tap "Print Receipt" → browser print dialog opens with thermal receipt layout
2. Open order history → tap print icon → reprints that order's receipt
3. Change receipt settings in admin (header text, disable address) → reprint → changes reflected
4. Test in different languages → receipt labels match selected locale
5. Test cash payment → shows cash received + change on receipt
6. Test variant product → shows variant name on receipt
7. iPad: uses AirPrint → prints to any AirPrint-compatible printer
