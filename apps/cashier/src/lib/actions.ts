"use server";

import {
  db,
  orders,
  orderItems,
  payments,
  products,
  productVariants,
  customers,
  eq,
  and,
  or,
  sql,
  isNull,
  logCashEvent,
  phoneSearchCandidates,
  normalizePhone,
} from "@macau-pos/database";
import { getAuthSession } from "./auth-actions";
import { getActiveShift } from "./shift-actions";

type CartItemInput = {
  productId?: string;
  name: string;
  translations?: Record<string, string>;
  unitPrice: number;
  quantity: number;
  discountAmount?: number;
  discountNote?: string;
  // Variant info (optional)
  variantId?: string;
  variantName?: string;
  optionCombo?: Record<string, string>;
};

export type OrderDiscount = { type: "percent" | "fixed"; value: number } | null;

type CreateOrderInput = {
  cart: CartItemInput[];
  paymentMethod: "tap" | "insert" | "qr" | "cash";
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total: number;
  cashReceived?: number;
  changeGiven?: number;
  customerId?: string;
  discountMeta?: OrderDiscount;
};

type CreateOrderResult =
  | { success: true; orderNumber: string }
  | { success: false; error: string };

function buildDatePrefix(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `CS-${yy}${mm}${dd}`;
}

export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  try {
    const session = await getAuthSession();
    if (!session?.tenantId) {
      return { success: false, error: "No active session. Please log in." };
    }
    const tenantId = session.tenantId;
    const locationId = session.locationId;
    const datePrefix = buildDatePrefix();
    const itemCount = input.cart.reduce((sum, item) => sum + item.quantity, 0);

    // Get active shift for order tagging
    const activeShift = await getActiveShift();

    const result = await db.transaction(async (tx) => {
      // Generate order number: CS-YYMMDD-XXXX
      const [lastOrder] = await tx
        .select({ orderNumber: orders.orderNumber })
        .from(orders)
        .where(
          sql`${orders.tenantId} = ${tenantId} AND ${orders.orderNumber} LIKE ${datePrefix + "-%"}`
        )
        .orderBy(sql`${orders.orderNumber} DESC`)
        .limit(1);

      let seq = 1;
      if (lastOrder) {
        const lastSeq = parseInt(lastOrder.orderNumber.split("-").pop() || "0");
        seq = lastSeq + 1;
      }
      const orderNumber = `${datePrefix}-${String(seq).padStart(4, "0")}`;

      // Insert order (with location from session)
      const [order] = await tx
        .insert(orders)
        .values({
          tenantId,
          locationId: locationId!,
          orderNumber,
          status: "completed",
          subtotal: input.subtotal.toFixed(2),
          discountAmount: (input.discountAmount ?? 0).toFixed(2),
          taxAmount: (input.taxAmount ?? 0).toFixed(2),
          total: input.total.toFixed(2),
          notes: input.discountMeta
            ? `Discount: ${input.discountMeta.type === "percent" ? `${input.discountMeta.value}%` : `${session.tenantCurrency || "MOP"} ${input.discountMeta.value}`}`
            : null,
          itemCount,
          currency: session.tenantCurrency || "MOP",
          cashierId: session.userId,
          terminalId: session.terminalId || null,
          shiftId: activeShift?.id || null,
          customerId: input.customerId || null,
        })
        .returning({ id: orders.id, orderNumber: orders.orderNumber });

      // Insert order items (with variant info if present)
      await tx.insert(orderItems).values(
        input.cart.map((item) => {
          const rawTotal = item.unitPrice * item.quantity;
          const itemDiscount = item.discountAmount ?? 0;
          return {
            orderId: order.id,
            productId: item.productId || null,
            name: item.name,
            translations: item.translations || {},
            unitPrice: item.unitPrice.toFixed(2),
            quantity: item.quantity,
            discountAmount: itemDiscount.toFixed(2),
            discountNote: item.discountNote || null,
            lineTotal: (rawTotal - itemDiscount).toFixed(2),
            variantId: item.variantId || null,
            variantName: item.variantName || null,
            optionCombo: item.optionCombo || null,
          };
        })
      );

      // Deduct stock for each item (skip items with null stock = unlimited)
      for (const item of input.cart) {
        if (item.variantId) {
          // Variant stock deduction
          await tx
            .update(productVariants)
            .set({ stock: sql`${productVariants.stock} - ${item.quantity}` })
            .where(
              and(
                eq(productVariants.id, item.variantId),
                sql`${productVariants.stock} IS NOT NULL`
              )
            );
        } else if (item.productId) {
          // Product stock deduction (only if not a variant product)
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${item.quantity}` })
            .where(
              and(
                eq(products.id, item.productId),
                sql`${products.stock} IS NOT NULL`
              )
            );
        }
      }

      // Insert payment
      const [payment] = await tx.insert(payments).values({
        orderId: order.id,
        method: input.paymentMethod,
        amount: input.total.toFixed(2),
        cashReceived: input.cashReceived?.toFixed(2) ?? null,
        changeGiven: input.changeGiven?.toFixed(2) ?? null,
      }).returning({ id: payments.id });

      return { orderNumber: order.orderNumber, orderId: order.id, paymentId: payment.id };
    });

    // Log cash events outside transaction (non-blocking)
    if (input.paymentMethod === "cash" && activeShift) {
      const cashIn = input.cashReceived || input.total;
      const changeOut = input.changeGiven || 0;

      await logCashEvent({
        tenantId,
        locationId: locationId!,
        shiftId: activeShift.id,
        terminalId: session.terminalId || null,
        eventType: "cash_sale",
        creditAmount: cashIn,
        orderId: result.orderId,
        paymentId: result.paymentId,
        recordedBy: session.userId,
        reason: `Order ${result.orderNumber}`,
      });

      if (changeOut > 0) {
        await logCashEvent({
          tenantId,
          locationId: locationId!,
          shiftId: activeShift.id,
          terminalId: session.terminalId || null,
          eventType: "cash_change",
          debitAmount: changeOut,
          orderId: result.orderId,
          paymentId: result.paymentId,
          recordedBy: session.userId,
          reason: `Change for ${result.orderNumber}`,
        });
      }
    }

    return { success: true, orderNumber: result.orderNumber };
  } catch (error) {
    console.error("Failed to create order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Barcode Lookup ──────────────────────────────────────────
export type BarcodeLookupResult =
  | { found: true; type: "product"; productId: string; name: string; price: number; image?: string; hasVariants: boolean; translations?: Record<string, string> }
  | { found: true; type: "variant"; productId: string; variantId: string; productName: string; variantName: string; price: number; image?: string; optionCombo: Record<string, string>; translations?: Record<string, string> }
  | { found: true; type: "customer"; customer: { id: string; name: string; phone: string | null; email: string | null } }
  | { found: false };

export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult> {
  const session = await getAuthSession();
  if (!session?.tenantId || !barcode.trim()) return { found: false };

  const code = barcode.trim();

  // Check product variants first (more specific)
  const [variant] = await db
    .select({
      id: productVariants.id,
      name: productVariants.name,
      sellingPrice: productVariants.sellingPrice,
      image: productVariants.image,
      optionCombo: productVariants.optionCombo,
      productId: productVariants.productId,
    })
    .from(productVariants)
    .where(
      and(
        eq(productVariants.barcode, code),
        eq(productVariants.isActive, true)
      )
    )
    .limit(1);

  if (variant) {
    // Get parent product name
    const [parent] = await db
      .select({ name: products.name, translations: products.translations })
      .from(products)
      .where(and(eq(products.id, variant.productId), eq(products.tenantId, session.tenantId)))
      .limit(1);

    return {
      found: true,
      type: "variant",
      productId: variant.productId,
      variantId: variant.id,
      productName: parent?.name || variant.name,
      variantName: variant.name,
      price: parseFloat(variant.sellingPrice),
      image: variant.image || undefined,
      optionCombo: (variant.optionCombo as Record<string, string>) || {},
      translations: (parent?.translations as Record<string, string>) || undefined,
    };
  }

  // Check products
  const [product] = await db
    .select({
      id: products.id,
      name: products.name,
      sellingPrice: products.sellingPrice,
      image: products.image,
      hasVariants: products.hasVariants,
      translations: products.translations,
    })
    .from(products)
    .where(
      and(
        eq(products.tenantId, session.tenantId),
        eq(products.barcode, code),
        isNull(products.deletedAt)
      )
    )
    .limit(1);

  if (product) {
    return {
      found: true,
      type: "product",
      productId: product.id,
      name: product.name,
      price: parseFloat(product.sellingPrice),
      image: product.image || undefined,
      hasVariants: product.hasVariants,
      translations: (product.translations as Record<string, string>) || undefined,
    };
  }

  // Check customers by phone (membership card scan)
  // Generates candidates: raw, with/without country code, with/without +
  const phoneCandidates = phoneSearchCandidates(code);

  const [customer] = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, session.tenantId),
        isNull(customers.deletedAt),
        sql`${customers.phone} IN (${sql.join(phoneCandidates.map(p => sql`${p}`), sql`, `)})`
      )
    )
    .limit(1);

  if (customer) {
    return {
      found: true,
      type: "customer",
      customer: { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email },
    };
  }

  return { found: false };
}

// ─── External Barcode Lookup (BarcodePlus / GS1 HK) ─────────
// Free public JSON service exposed by GS1 Hong Kong's BarcodePlus
// platform. No auth, no captcha. Use only as a fallback when a
// scanned barcode is missing from the local catalog.

export type ExternalLookupSource = "gs1hk" | "gs1cn" | "gs1jp";

// Discriminated outcome from an external GS1 registry lookup.
//  - found:      provider returned full product details
//  - registered: provider confirms the GTIN is registered but has no metadata
//                (GS1 HK PRD.CD015 — common for small-brand SKUs)
//  - missing:    provider has no record of this GTIN at all
//  - error:      lookup failed (timeout / network / auth / bad response)
export type ExternalLookupOutcome =
  | {
      kind: "found";
      source: ExternalLookupSource;
      gtin: string;
      name: string;
      brand?: string;
      company?: string;
      category?: string;
      origin?: string;
    }
  | { kind: "registered"; source: "gs1hk"; gtin: string }
  | { kind: "missing"; source: ExternalLookupSource; gtin: string }
  | {
      kind: "error";
      source: ExternalLookupSource;
      gtin: string;
      reason: "timeout" | "network" | "auth" | "unknown";
    };

// Back-compat alias — the "found" shape used to be the sole return type.
export type ExternalBarcodeResult = Extract<ExternalLookupOutcome, { kind: "found" }>;

// Direct GTIN → product lookup. Discovered by reverse-engineering the
// product detail page (/eid/view/product.html). The /eid/... search
// endpoint is text-based and does NOT index by GTIN, so we use the
// MCC2 endpoint that the product page itself calls.
const BARCODEPLUS_URL =
  "https://www.barcodeplus.com.hk/app/resource/jsonservice";

function localeToBarcodePlusLang(locale: string): "en" | "zh_TW" | "zh_CN" {
  if (locale === "tc") return "zh_TW";
  if (locale === "sc") return "zh_CN";
  return "en";
}

type BcpProduct = {
  prodName?: string;
  prodDesc?: string;
  brandName?: string;
  prodbrandName?: string;
  country?: string;
  netWeight?: string;
};
type BcpCompany = { name?: string };
type BcpDataItem = {
  product?: BcpProduct;
  company?: BcpCompany;
};
type BcpErrorItem = { code?: string; message?: string; details?: string };
type BcpResponse = {
  result?: Array<{ data?: BcpDataItem[] }>;
  errors?: BcpErrorItem[];
  code?: string;
  message?: string;
};

// "Raw" classification of a single BarcodePlus response.
type BcpClassified =
  | { tag: "found"; item: BcpDataItem }
  | { tag: "registered" } // PRD.CD015 — registered, no product details
  | { tag: "empty" } // no data, no recognisable error
  | { tag: "retryable" } // generic Validate error — worth retrying in EN
  | { tag: "error"; reason: "timeout" | "network" | "unknown" };

async function fetchBarcodePlusOnce(
  gtin: string,
  langId: "en" | "zh_TW" | "zh_CN"
): Promise<BcpClassified> {
  const payload = { appCode: "MCC2", method: "getProdDetailsByGTIN", gtin, langId };
  const url = `${BARCODEPLUS_URL}?data=${encodeURIComponent(JSON.stringify(payload))}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 macau-pos" },
      cache: "no-store",
    });
    if (!res.ok) return { tag: "error", reason: "network" };
    const json = (await res.json()) as BcpResponse;

    if (json?.errors?.length) {
      const codes = json.errors.map((e) => e.code || "");
      if (codes.includes("PRD.CD015")) return { tag: "registered" };
      // Unrecognised structured error — retryable if we're in a zh locale
      return { tag: "retryable" };
    }
    // zh_TW / zh_CN sometimes return { code: "Validate", message: "[ Validate ]" }
    // at the top level instead of an errors array. Treat the same way.
    if (json?.code && json?.code !== "OK") return { tag: "retryable" };

    const item = json?.result?.[0]?.data?.[0];
    if (!item?.product?.prodName) return { tag: "empty" };
    return { tag: "found", item };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return { tag: "error", reason: name === "AbortError" ? "timeout" : "unknown" };
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupBarcodePlus(
  gtin: string,
  locale: string = "en"
): Promise<ExternalLookupOutcome> {
  if (!/^\d{13}$/.test(gtin)) {
    return { kind: "missing", source: "gs1hk", gtin };
  }
  const langId = localeToBarcodePlusLang(locale);

  let classified = await fetchBarcodePlusOnce(gtin, langId);

  // If zh locales returned a generic Validate error, retry once in English —
  // the EN endpoint gives structured PRD.CDxxx codes we can distinguish.
  if (classified.tag === "retryable" && langId !== "en") {
    classified = await fetchBarcodePlusOnce(gtin, "en");
  }

  switch (classified.tag) {
    case "found": {
      const product = classified.item.product!;
      return {
        kind: "found",
        source: "gs1hk",
        gtin,
        name: product.prodName!,
        brand: product.brandName || product.prodbrandName || undefined,
        company: classified.item.company?.name || undefined,
        category: undefined,
        origin: product.country || undefined,
      };
    }
    case "registered":
      return { kind: "registered", source: "gs1hk", gtin };
    case "empty":
      return { kind: "missing", source: "gs1hk", gtin };
    case "retryable":
      // EN retry still came back with a generic error — treat as upstream error
      return { kind: "error", source: "gs1hk", gtin, reason: "unknown" };
    case "error":
      return { kind: "error", source: "gs1hk", gtin, reason: classified.reason };
  }
}

// ─── External Barcode Lookup (GDS / GS1 China / ANCC) ──────
// Member-account-only API behind passport.gds.org.cn OIDC. We use a
// long-lived refresh_token (provisioned out-of-band, see lib/gds-token.ts)
// to mint short-lived access tokens, then call the BFF endpoint that the
// gds.org.cn web app itself uses.

const GDS_LOOKUP_URL =
  "https://bff.gds.org.cn/gds/searching-api/ProductService/ProductListByGTIN";

type GdsItem = {
  RegulatedProductName?: string;
  keyword?: string;
  brandcn?: string;
  firm_name?: string;
  gpcname?: string;
  specification?: string;
};

export async function lookupGdsCn(
  gtin: string,
  _locale: string = "en"
): Promise<ExternalLookupOutcome> {
  if (!/^\d{13}$/.test(gtin)) {
    return { kind: "missing", source: "gs1cn", gtin };
  }

  const { getGdsAccessToken } = await import("./gds-token");
  const token = await getGdsAccessToken();
  if (!token) {
    return { kind: "error", source: "gs1cn", gtin, reason: "auth" };
  }

  // GDS expects GTIN-14 — pad EAN-13 with a leading zero.
  const gtin14 = "0" + gtin;
  const url = `${GDS_LOOKUP_URL}?PageSize=1&PageIndex=1&SearchItem=${gtin14}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        Origin: "https://www.gds.org.cn",
        currentRole: "Mine",
      },
      cache: "no-store",
    });
    if (!res.ok) {
      return { kind: "error", source: "gs1cn", gtin, reason: "network" };
    }
    const json = (await res.json()) as {
      Code?: number;
      Data?: { Items?: GdsItem[] };
    };
    if (json?.Code !== 1) {
      return { kind: "error", source: "gs1cn", gtin, reason: "unknown" };
    }
    const item = json?.Data?.Items?.[0];
    if (!item) return { kind: "missing", source: "gs1cn", gtin };

    const name =
      item.RegulatedProductName?.trim() || item.keyword?.trim() || null;
    if (!name) return { kind: "missing", source: "gs1cn", gtin };

    return {
      kind: "found",
      source: "gs1cn",
      gtin,
      name,
      brand: item.brandcn?.trim() || undefined,
      company: item.firm_name?.trim() || undefined,
      category: item.gpcname?.trim() || undefined,
      origin: "中國",
    };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return {
      kind: "error",
      source: "gs1cn",
      gtin,
      reason: name === "AbortError" ? "timeout" : "unknown",
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── External Barcode Lookup (Rakuten Ichiba + Yahoo Shopping / GS1 Japan) ──
// GS1 Japan's JICFS/IFDB is member-only, so there is no BarcodePlus-equivalent
// free GS1 JP endpoint. Instead we fall back to two major Japanese marketplaces
// that index by JAN: Rakuten Ichiba (keyword search) and Yahoo! Shopping (jan_code).
// Both require a free developer app ID.

const RAKUTEN_ICHIBA_URL =
  "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601";
const YAHOO_SHOPPING_URL =
  "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";

type RakutenItem = {
  itemName?: string;
  itemCaption?: string;
  shopName?: string;
  genreId?: number;
};
type RakutenItemsV2Response = {
  Items?: RakutenItem[];
  // Format v1 wraps each item in { Item: {...} }
  // We request formatVersion=2 so the above is the shape we get.
};
type RakutenError = { error?: string; error_description?: string };

type YahooHit = {
  name?: string;
  janCode?: string;
  brand?: { id?: number; name?: string };
  genreCategory?: { id?: number; name?: string };
  seller?: { name?: string };
};
type YahooResponse = {
  totalResultsAvailable?: number;
  totalResultsReturned?: number;
  hits?: YahooHit[];
  // Error envelope when appid is invalid:
  //   { "Error": { "Message": "...", "Code": "..." } }
  Error?: { Message?: string; Code?: string };
};

async function lookupRakutenIchiba(gtin: string): Promise<ExternalLookupOutcome> {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    return { kind: "error", source: "gs1jp", gtin, reason: "auth" };
  }

  const url =
    `${RAKUTEN_ICHIBA_URL}?applicationId=${encodeURIComponent(appId)}` +
    `&keyword=${gtin}&hits=1&formatVersion=2`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (res.status === 404) {
      const json = (await res.json().catch(() => null)) as RakutenError | null;
      if (json?.error === "not_found") {
        return { kind: "missing", source: "gs1jp", gtin };
      }
      return { kind: "error", source: "gs1jp", gtin, reason: "network" };
    }
    if (!res.ok) {
      return { kind: "error", source: "gs1jp", gtin, reason: "network" };
    }
    const json = (await res.json()) as RakutenItemsV2Response;
    const item = json?.Items?.[0];
    if (!item?.itemName) return { kind: "missing", source: "gs1jp", gtin };

    return {
      kind: "found",
      source: "gs1jp",
      gtin,
      name: item.itemName,
      brand: undefined,
      company: item.shopName || undefined,
      category: undefined,
      origin: "日本",
    };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return {
      kind: "error",
      source: "gs1jp",
      gtin,
      reason: name === "AbortError" ? "timeout" : "unknown",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function lookupYahooShoppingJp(gtin: string): Promise<ExternalLookupOutcome> {
  const appId = process.env.YAHOO_JP_APP_ID;
  if (!appId) {
    return { kind: "error", source: "gs1jp", gtin, reason: "auth" };
  }

  const url =
    `${YAHOO_SHOPPING_URL}?appid=${encodeURIComponent(appId)}` +
    `&jan_code=${gtin}&results=1`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5000);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) {
      return { kind: "error", source: "gs1jp", gtin, reason: "network" };
    }
    const json = (await res.json()) as YahooResponse;
    if (json?.Error) {
      return { kind: "error", source: "gs1jp", gtin, reason: "auth" };
    }
    const hit = json?.hits?.[0];
    if (!hit?.name) return { kind: "missing", source: "gs1jp", gtin };

    return {
      kind: "found",
      source: "gs1jp",
      gtin,
      name: hit.name,
      brand: hit.brand?.name || undefined,
      company: hit.seller?.name || undefined,
      category: hit.genreCategory?.name || undefined,
      origin: "日本",
    };
  } catch (err) {
    const name = (err as { name?: string })?.name;
    return {
      kind: "error",
      source: "gs1jp",
      gtin,
      reason: name === "AbortError" ? "timeout" : "unknown",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupJanJp(
  gtin: string,
  _locale: string = "en"
): Promise<ExternalLookupOutcome> {
  if (!/^\d{13}$/.test(gtin)) {
    return { kind: "missing", source: "gs1jp", gtin };
  }

  // Try Rakuten first — broader catalog coverage for consumer goods.
  const rakuten = await lookupRakutenIchiba(gtin);
  if (rakuten.kind === "found") return rakuten;

  // Fall back to Yahoo Shopping for anything Rakuten didn't surface.
  // If Yahoo also doesn't find it, prefer the Yahoo outcome only when it
  // carries more information (e.g. auth error); otherwise keep Rakuten's.
  const yahoo = await lookupYahooShoppingJp(gtin);
  if (yahoo.kind === "found") return yahoo;

  // Both providers returned non-found. Prefer missing over error so the
  // cashier can still create a temp product manually.
  if (rakuten.kind === "missing" || yahoo.kind === "missing") {
    return { kind: "missing", source: "gs1jp", gtin };
  }
  return rakuten.kind === "error" ? rakuten : yahoo;
}

// ─── Get Product Variants (for cashier variant picker) ─────
export async function fetchProductVariants(productId: string) {
  const { getProductVariantsForCashier } = await import("./queries");
  return getProductVariantsForCashier(productId);
}

// ─── Search Customers by Phone ─────────────────────────────
export type CustomerSearchResult = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  isVerified: boolean;
};

export async function searchCustomersByPhone(
  query: string
): Promise<CustomerSearchResult[]> {
  const session = await getAuthSession();
  if (!session?.tenantId || !query.trim()) return [];

  // Search by all candidate phone forms (handles area codes)
  const candidates = phoneSearchCandidates(query.trim());
  const likeConditions = candidates.map(c => sql`${customers.phone} ILIKE ${"%" + c + "%"}`);

  const results = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      email: customers.email,
      avatar: customers.avatar,
      isVerified: customers.isVerified,
    })
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, session.tenantId),
        isNull(customers.deletedAt),
        or(...likeConditions)
      )
    )
    .limit(10);

  return results;
}
