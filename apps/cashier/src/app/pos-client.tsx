"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { type CartItem, type ItemDiscount, type Product } from "@/data/mock";

export type CategoryData = {
  id: string;
  nameKey: string;
  name: string;
  translations?: Record<string, string> | null;
  icon: string;
  parentId?: string | null;
  children?: CategoryData[];
};

export type ProductData = Product;
import { type Locale, localeNames, t, getProductName } from "@/i18n/locales";
import { Flag } from "@/components/shared/flags";
import { merchantThemes, applyTheme } from "@/lib/theme";
// logout handled via cookie deletion + redirect
import CheckoutModal from "@/components/checkout/checkout-modal";
import VariantPicker, { type VariantOption, type VariantItem } from "@/components/variant-picker";
import HistorySheet from "@/components/history/history-sheet";
import LockScreen from "@/components/shared/lock-screen";
import KeypadView from "@/components/pos/keypad-view";
import DiscountPopover from "@/components/pos/discount-popover";
import dynamic from "next/dynamic";
const CameraScanner = dynamic(() => import("@/components/scanner/camera-scanner"), { ssr: false });
import ScanFeedback, { type ScanFeedbackState } from "@/components/scanner/scan-feedback";
import CustomerSearchSpotlight from "@/components/customer/customer-search-spotlight";
import CustomerDetailSheet, { type LinkedCustomer } from "@/components/customer/customer-detail-sheet";
import ProductSearchSpotlight from "@/components/search/product-search-spotlight";
import { fetchProductVariants, lookupBarcode, type OrderDiscount } from "@/lib/actions";
import { useBarcodeScanner } from "@/lib/use-barcode-scanner";
import { useCatalogSync } from "@/lib/use-catalog-sync";
import { resolveImageSrc } from "@/lib/catalog-image-sync";
import { getCachedVariants } from "@/lib/catalog-sync";
import SyncOverlay from "@/components/shared/sync-overlay";
import { useOnlineStatus } from "@/lib/use-online-status";
import { getPendingCount, syncPendingOrders } from "@/lib/offline-queue";
import {
  LayoutGrid, Coffee, Cookie, Snowflake, Milk, Home, Heart, Flame,
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard,
  UserPlus, X, Languages, Check, Settings, Calculator, Star, LibraryBig,
  Palette, LogOut, Lock, Clock, Receipt, Wifi, WifiOff, Loader2, ChevronRight, ClipboardList, Monitor, BarChart3, Wallet, TrendingUp, Store, Globe, Package, ScanLine, RefreshCw,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid, Coffee, Cookie, Snowflake, Milk, Home, Heart, Flame,
};

import CloseButton from "@/components/shared/close-button";
import Avatar from "@/components/shared/avatar";
import ConfirmDialog from "@/components/shared/confirm-dialog";
import ShiftOpenModal from "@/components/shift/shift-open-modal";
import ShiftCloseModal from "@/components/shift/shift-close-modal";
import ShiftSummaryPanel from "@/components/shift/shift-summary-panel";

// Live shift duration timer — updates every minute
function ShiftTimer({ shiftId }: { shiftId: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    let openedAt: number | null = null;
    let iv: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (!openedAt) return;
      const mins = Math.floor((Date.now() - openedAt) / 60000);
      if (mins < 60) setElapsed(`${mins}m`);
      else setElapsed(`${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ""}`);
    };

    // Fetch shift openedAt, then start ticking
    import("@/lib/shift-actions").then(({ getActiveShift }) =>
      getActiveShift().then((s) => {
        if (s) {
          openedAt = new Date(s.openedAt).getTime();
          tick();
          iv = setInterval(tick, 30000);
        }
      }).catch(() => { /* offline */ })
    );

    return () => { if (iv) clearInterval(iv); };
  }, [shiftId]);

  if (!elapsed) return null;
  return (
    <span className="text-[11px] font-medium text-pos-accent tabular-nums hidden sm:inline">
      {elapsed}
    </span>
  );
}

type Props = {
  initialProducts: ProductData[];
  initialCategories: CategoryData[];
  userName?: string | null;
  userAvatar?: string | null;
  userId?: string | null;
  userPinHash?: string | null;
  locationId?: string | null;
  terminalName?: string | null;
  terminalCode?: string | null;
  activeShiftId?: string | null;
  taxRate?: number;
  currency?: string;
};

// Drawer cash ledger — shows all cash events for the current shift
function DrawerLedger({ shiftId, locale }: { shiftId: string; locale: Locale }) {
  const [entries, setEntries] = useState<{ id: string; eventType: string; creditAmount: string; debitAmount: string; balanceAfter: string; reason: string | null; createdAt: Date }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import("@/lib/shift-actions").then(({ fetchCashLog }) =>
      fetchCashLog(shiftId).then((data) => {
        setEntries(data);
        setLoading(false);
      }).catch(() => { setLoading(false); })
    );
  }, [shiftId]);

  const EVENT_LABELS: Record<string, string> = {
    shift_open: "eventOpeningFloat",
    cash_sale: "eventCashSale",
    cash_change: "eventChangeGiven",
    refund: "eventRefund",
    shift_close: "eventShiftClose",
  };

  if (loading) return <div className="flex justify-center py-8"><span className="h-6 w-6 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" /></div>;

  return (
    <div className="mt-6">
      <h3 className="text-[14px] font-semibold text-pos-text mb-3">{t(locale, "drawerLedger")}</h3>
      <div className="bg-pos-surface border border-pos-border rounded-[var(--radius-md)] overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-5 gap-2 px-4 py-2.5 bg-pos-bg text-[11px] font-medium text-pos-text-muted uppercase tracking-wider border-b border-pos-border">
          <span>{t(locale, "drawerTime")}</span>
          <span>{t(locale, "drawerEvent")}</span>
          <span className="text-right">{t(locale, "drawerIn")}</span>
          <span className="text-right">{t(locale, "drawerOut")}</span>
          <span className="text-right">{t(locale, "drawerBalance")}</span>
        </div>
        {/* Rows */}
        {entries.length === 0 ? (
          <div className="px-4 py-8 text-center text-[13px] text-pos-text-muted">{t(locale, "drawerNoEntries")}</div>
        ) : (
          entries.map((entry) => {
            const credit = parseFloat(entry.creditAmount);
            const debit = parseFloat(entry.debitAmount);
            return (
              <div key={entry.id} className="grid grid-cols-5 gap-2 px-4 py-2.5 text-[13px] border-b border-pos-border last:border-0 hover:bg-pos-surface-hover transition-colors">
                <span className="text-pos-text-muted tabular-nums">
                  {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-pos-text">
                  {EVENT_LABELS[entry.eventType] ? t(locale, EVENT_LABELS[entry.eventType] as any) : entry.eventType}
                  {entry.reason && <span className="block text-[11px] text-pos-text-muted truncate">{entry.reason}</span>}
                </span>
                <span className={cn("text-right tabular-nums", credit > 0 ? "text-pos-success font-medium" : "text-pos-text-muted")}>
                  {credit > 0 ? `+${credit.toFixed(2)}` : "—"}
                </span>
                <span className={cn("text-right tabular-nums", debit > 0 ? "text-pos-danger font-medium" : "text-pos-text-muted")}>
                  {debit > 0 ? `-${debit.toFixed(2)}` : "—"}
                </span>
                <span className="text-right font-semibold text-pos-text tabular-nums">
                  {parseFloat(entry.balanceAfter).toFixed(2)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Shared product card grid — used by Library and Favorites views
function ProductGrid({ products, cart, addedId, locale, currency, favoriteIds, onAdd, onLongPress, onToggleFavorite }: {
  products: Product[];
  cart: CartItem[];
  addedId: string | null;
  locale: Locale;
  currency: string;
  favoriteIds: Set<string>;
  onAdd: (p: Product) => void;
  onLongPress?: (p: Product) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  function handlePointerDown(product: Product) {
    didLongPress.current = false;
    longPressRef.current = setTimeout(() => {
      didLongPress.current = true;
      if (product.inStock && onLongPress) onLongPress(product);
    }, 800);
  }

  function handlePointerUp() {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
      {products.map((product) => {
        const inCart = cart.find((item) => item.id === product.id);
        const justAdded = addedId === product.id;
        const displayName = getProductName(product, locale);
        return (
          <div
            key={product.id}
            onClick={() => { if (!didLongPress.current && product.inStock) onAdd(product); }}
            onPointerDown={() => handlePointerDown(product)}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onContextMenu={(e) => e.preventDefault()}
            role="button"
            tabIndex={0}
            aria-label={`${displayName}, ${currency} ${product.price}`}
            className={cn(
              "relative flex flex-col p-2.5 rounded-[var(--radius-md)] border transition-all text-left group",
              !product.inStock
                ? "border-pos-border opacity-40 cursor-not-allowed bg-pos-surface"
                : inCart
                ? "border-pos-accent/30 bg-pos-accent-light shadow-sm cursor-pointer"
                : "border-pos-border bg-pos-surface hover:border-pos-border-strong hover:shadow-sm active:scale-[0.97] cursor-pointer",
              justAdded && "scale-[0.97]"
            )}
          >
            <p className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wide h-[14px] truncate">
              {product.brand || "\u00A0"}
            </p>
            <div className="relative w-full aspect-square rounded-[var(--radius-sm)] bg-pos-bg my-1.5 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img src={resolveImageSrc(product.image)} alt="" className="h-full w-full object-contain pointer-events-none select-none" draggable={false} loading="lazy" fetchPriority="low" />
              ) : (
                <ShoppingBag className="h-7 w-7 text-pos-text-muted/40" strokeWidth={1.25} />
              )}
              {inCart && (
                <div className="absolute inset-0 rounded-[var(--radius-sm)]" style={{ backgroundColor: "color-mix(in srgb, var(--color-pos-accent) 15%, transparent)" }} />
              )}
            </div>
            <p className="text-[12px] font-medium text-pos-text leading-tight line-clamp-2" title={displayName}>
              {displayName}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[16px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>
                {currency} {product.price.toFixed(product.price % 1 === 0 ? 0 : 1)}
              </span>
              {inCart && (
                <span className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-[var(--radius-full)]" style={{ backgroundColor: "var(--color-pos-accent)" }}>
                  ×{inCart.quantity}
                </span>
              )}
            </div>
            {/* Top-right: popular flame + favorite star + variant badge */}
            {product.inStock && (
              <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {product.popular && (
                    <Flame className="h-3.5 w-3.5 text-pos-warning" />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleFavorite(product.id); }}
                    className={cn(
                      "h-6 w-6 flex items-center justify-center rounded-full transition-all",
                      favoriteIds.has(product.id)
                        ? "text-amber-500 bg-amber-50"
                        : "text-pos-text-muted/30 hover:text-amber-500 hover:bg-amber-50"
                    )}
                  >
                    <Star className={cn("h-3.5 w-3.5", favoriteIds.has(product.id) && "fill-amber-500")} />
                  </button>
                </div>
                {product.hasVariants && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-[var(--radius-full)] bg-pos-surface border border-pos-border text-pos-text-secondary">
                    {t(locale, "variants")}
                  </span>
                )}
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)]">
                <span className="text-[12px] font-medium text-pos-danger bg-white/90 px-3 py-1 rounded-[var(--radius-full)] shadow-sm">
                  {t(locale, "outOfStock")}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function POSClient({ initialProducts, initialCategories, userName, userAvatar, userId, userPinHash, locationId, terminalName, terminalCode, activeShiftId, taxRate = 0, currency = "MOP" }: Props) {
  const catalog = useCatalogSync(initialProducts, initialCategories, locationId || null);
  const [locale, setLocale] = useState<Locale>("tc");
  const [activeTab, setActiveTab] = useState<"cashier" | "orders" | "reports">("cashier");
  const [reportView, setReportView] = useState<"drawer" | "sales">("drawer");
  const [orderChannel, setOrderChannel] = useState<"all" | "pos" | "online">("all");
  const [activeView, setActiveView] = useState<"library" | "keypad" | "favorites">("library");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [subRowExpanded, setSubRowExpanded] = useState(true);
  const [cart, setCartState] = useState<CartItem[]>([]);
  const setCart: typeof setCartState = useCallback((update) => {
    setCartState(prev => {
      const next = typeof update === "function" ? update(prev) : update;
      try { sessionStorage.setItem("pos-cart", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [spotlightInput, setSpotlightInput] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [menuLevel, setMenuLevel] = useState<"main" | "theme" | "language">("main");
  const [currentTheme, setCurrentTheme] = useState("default");
  const [addedId, setAddedId] = useState<string | null>(null);
  const knownCartIdsRef = useRef<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [showReloadConfirm, setShowReloadConfirm] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [shiftId, setShiftId] = useState<string | null>(activeShiftId || null);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<ScanFeedbackState>(null);
  const [showCustomerDetail, setShowCustomerDetail] = useState(false);
  const [linkedCustomer, setLinkedCustomer] = useState<LinkedCustomer | null>(null);
  const [showShiftClose, setShowShiftClose] = useState(false);
  const [locked, setLocked] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("pos-locked") === "1";
    }
    return false;
  });
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search spotlight state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchOrigin, setSearchOrigin] = useState({ x: 0, y: 0 });
  const searchBtnRef = useRef<HTMLElement>(null);


  // Variant picker state
  const [variantPickerOpen, setVariantPickerOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [variantItems, setVariantItems] = useState<VariantItem[]>([]);
  const [variantLoading, setVariantLoading] = useState(false);

  // Restore persisted locale and theme from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("pos-locale");
    if (savedLocale && savedLocale in localeNames) setLocale(savedLocale as Locale);
    const savedTheme = localStorage.getItem("pos-theme");
    if (savedTheme && savedTheme in merchantThemes) setCurrentTheme(savedTheme);
    // Save current user name for the lock screen welcome message
    if (userName) localStorage.setItem("pos-last-user", userName);
    setPendingCount(getPendingCount());
    try {
      const savedCart = sessionStorage.getItem("pos-cart");
      if (savedCart) setCartState(JSON.parse(savedCart));
    } catch { /* ignore */ }
    try {
      const saved = localStorage.getItem("pos-favorites");
      if (saved) setFavoriteIds(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  // Auto-sync pending orders when coming back online
  useEffect(() => {
    if (isOnline && mounted && getPendingCount() > 0) {
      syncPendingOrders().then(() => {
        setPendingCount(getPendingCount());
      }).catch(() => { /* offline */ });
    }
  }, [isOnline, mounted]);

  useEffect(() => {
    applyTheme(merchantThemes[currentTheme]);
    if (mounted) localStorage.setItem("pos-theme", currentTheme);
  }, [currentTheme, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("pos-locale", locale);
      document.cookie = `pos-locale=${locale};path=/;max-age=31536000`;
    }
  }, [locale, mounted]);

  // ─── Idle auto-lock (5 minutes) ───────────────────────────
  const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!locked) {
      idleTimerRef.current = setTimeout(() => {
        setLocked(true);
        sessionStorage.setItem("pos-locked", "1");
      }, IDLE_TIMEOUT);
    }
  }, [locked]);

  useEffect(() => {
    if (locked) return; // Don't set idle timer when already locked
    const events = ["mousedown", "keydown", "touchstart", "mousemove", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer(); // Start timer
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [locked, resetIdleTimer]);

  const handleLockScreen = useCallback(() => {
    setLocked(true);
    sessionStorage.setItem("pos-locked", "1");
  }, []);

  const handleUnlock = useCallback(() => {
    setLocked(false);
    sessionStorage.removeItem("pos-locked");
  }, []);

  const handleForceLogout = useCallback(() => {
    // 5 failed PIN attempts → full logout
    sessionStorage.removeItem("pos-locked");
    sessionStorage.removeItem("pos-images-cached");
    window.stop(); fetch("/api/logout", { method: "POST" }).catch(() => {}); window.location.replace("/login");
  }, []);


  // Find the active parent category and its children
  const activeParent = useMemo(() => {
    return catalog.categories.find((c) => c.id === activeCategory);
  }, [catalog.categories, activeCategory]);

  const activeChildren = activeParent?.children || [];

  const filtered = useMemo(() => {
    let list = catalog.products;
    if (activeCategory === "popular") {
      list = list.filter((p) => p.popular);
    } else if (activeCategory !== "all") {
      if (activeSubCategory) {
        // Filter by specific sub-category
        list = list.filter((p) => p.category === activeSubCategory);
      } else if (activeChildren.length > 0) {
        // Parent with children: show products from parent + all children
        const catIds = new Set([activeCategory, ...activeChildren.map((c) => c.id)]);
        list = list.filter((p) => catIds.has(p.category));
      } else {
        list = list.filter((p) => p.category === activeCategory);
      }
    }
    // Filter by all search tags (AND logic) + spotlight live input
    const allTerms = [...searchTags, ...(spotlightInput ? [spotlightInput] : [])];
    for (const term of allTerms) {
      const q = term.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.translations && Object.values(p.translations).some(v => v.toLowerCase().includes(q)))
      );
    }
    return list;
  }, [catalog.products, activeCategory, activeSubCategory, activeChildren, searchTags, spotlightInput]);

  const [confirmUnfavorite, setConfirmUnfavorite] = useState<string | null>(null);

  const toggleFavorite = useCallback((productId: string) => {
    setFavoriteIds(prev => {
      if (prev.has(productId)) {
        // Show confirm instead of removing immediately
        setConfirmUnfavorite(productId);
        return prev;
      }
      const next = new Set(prev);
      next.add(productId);
      localStorage.setItem("pos-favorites", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const confirmRemoveFavorite = useCallback(() => {
    if (!confirmUnfavorite) return;
    setFavoriteIds(prev => {
      const next = new Set(prev);
      next.delete(confirmUnfavorite);
      localStorage.setItem("pos-favorites", JSON.stringify([...next]));
      return next;
    });
    setConfirmUnfavorite(null);
  }, [confirmUnfavorite]);

  // Add custom item from keypad
  const addCustomToCart = useCallback((product: Product) => {
    setCart(prev => [...prev, { ...product, quantity: 1 }]);
  }, []);

  const addToCart = useCallback((product: Product) => {
    if (!product.inStock) return;

    // If product has variants, open variant picker instead of adding directly
    if (product.hasVariants) {
      setVariantProduct(product);
      setVariantOptions([]);
      setVariantItems([]);
      setVariantLoading(true);
      setVariantPickerOpen(true);
      fetchProductVariants(product.id)
        .then(({ options, variants }) => {
          setVariantOptions(options);
          setVariantItems(variants.map(v => ({
            ...v,
            optionCombo: v.optionCombo as Record<string, string>,
          })));
        })
        .catch(async () => {
          const cached = await getCachedVariants(product.id);
          if (cached) {
            setVariantOptions(cached.options);
            setVariantItems(cached.variants.map(v => ({
              ...v,
              optionCombo: v.optionCombo as Record<string, string>,
            })));
          }
        })
        .finally(() => setVariantLoading(false));
      return;
    }

    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 300);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, []);

  // Long press — open product in variant picker view (with or without variants)
  const openProductPreview = useCallback((product: Product) => {
    if (!product.inStock) return;
    setVariantProduct(product);
    setVariantOptions([]);
    setVariantItems([]);
    setVariantPickerOpen(true);
    if (product.hasVariants) {
      setVariantLoading(true);
      fetchProductVariants(product.id)
        .then(({ options, variants }) => {
          setVariantOptions(options);
          setVariantItems(variants.map(v => ({
            ...v,
            optionCombo: v.optionCombo as Record<string, string>,
          })));
        })
        .catch(async () => {
          const cached = await getCachedVariants(product.id);
          if (cached) {
            setVariantOptions(cached.options);
            setVariantItems(cached.variants.map(v => ({
              ...v,
              optionCombo: v.optionCombo as Record<string, string>,
            })));
          }
        })
        .finally(() => setVariantLoading(false));
    } else {
      // No variants — show empty options so picker renders product info + add button
      setVariantOptions([]);
      setVariantItems([]);
      setVariantLoading(false);
    }
  }, []);

  // Handle variant selection — add to cart with variant-specific data
  const handleVariantSelect = useCallback((variant: VariantItem) => {
    if (!variantProduct) return;
    const variantCartId = `${variantProduct.id}__${variant.id}`;
    const variantName = Object.values(variant.optionCombo).join(" / ");
    setAddedId(variantProduct.id);
    setTimeout(() => setAddedId(null), 300);
    setCart((prev) => {
      const existing = prev.find((item) => item.id === variantCartId);
      if (existing) {
        return prev.map((item) =>
          item.id === variantCartId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        ...variantProduct,
        id: variantCartId,
        name: `${variantProduct.name} · ${variantName}`,
        price: parseFloat(variant.sellingPrice),
        quantity: 1,
        variantOptions: Object.values(variant.optionCombo),
      }];
    });
    setVariantPickerOpen(false);
    setVariantProduct(null);
  }, [variantProduct]);

  const updateQuantity = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item)).filter((item) => item.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const [discountItemId, setDiscountItemId] = useState<string | null>(null);

  const applyItemDiscount = useCallback((id: string, discount: ItemDiscount) => {
    setCart((prev) =>
      prev.map((item) => item.id === id ? { ...item, discount } : item)
    );
    setDiscountItemId(null);
  }, []);


  const [orderDiscount, setOrderDiscount] = useState<OrderDiscount>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [showDiscountPopover, setShowDiscountPopover] = useState(false);

  // Compute item line total with per-item discount
  function itemLineTotal(item: CartItem): number {
    const raw = item.price * item.quantity;
    if (!item.discount) return raw;
    if (item.discount.type === "percent") return Math.round(raw * (1 - item.discount.value / 100) * 100) / 100;
    return Math.max(0, raw - item.discount.value);
  }

  const subtotal = cart.reduce((sum, item) => sum + itemLineTotal(item), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const discountAmount = orderDiscount
    ? orderDiscount.type === "percent"
      ? Math.round(subtotal * orderDiscount.value / 100 * 100) / 100
      : Math.min(orderDiscount.value, subtotal)
    : 0;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = Math.round(afterDiscount * taxRate / 100 * 100) / 100;
  const total = afterDiscount + taxAmount;

  const clearCart = useCallback(() => {
    setCart([]);
    setOrderDiscount(null);
    knownCartIdsRef.current.clear();
  }, []);

  const handleCheckoutComplete = useCallback((orderNumber: string) => {
    setCart([]);
    setLinkedCustomer(null);
    setOrderDiscount(null);
    setShowCheckout(false);
    setPendingCount(getPendingCount());
    knownCartIdsRef.current.clear();
  }, []);

  // ─── Barcode scanner ───────────────────────────────────────
  const showScanFeedback = useCallback(
    (kind: "success" | "not-found" | "error", message: string) => {
      setScanFeedback({ kind, message, nonce: Date.now() });
    },
    []
  );

  const handleBarcodeScan = useCallback(async (barcode: string) => {
    const code = barcode.trim();
    let result;
    try {
      result = await lookupBarcode(code);
    } catch {
      showScanFeedback("error", t(locale, "scanError").replace("{code}", code));
      return;
    }
    if (!result.found) {
      showScanFeedback("not-found", t(locale, "scanNotFound").replace("{code}", code));
      return;
    }

    // Customer membership card
    if (result.type === "customer") {
      setLinkedCustomer({
        id: result.customer.id,
        name: result.customer.name,
        phone: result.customer.phone || undefined,
        email: result.customer.email || undefined,
      });
      showScanFeedback(
        "success",
        t(locale, "scanCustomerLinked").replace("{name}", result.customer.name)
      );
      return;
    }

    if (result.type === "variant") {
      // Add variant directly to cart
      const variantCartId = `${result.productId}__${result.variantId}`;
      const variantName = Object.values(result.optionCombo).join(" / ");
      const displayName = `${result.productName} · ${variantName}`;
      setAddedId(result.productId);
      setTimeout(() => setAddedId(null), 300);
      setCart((prev) => {
        const existing = prev.find((item) => item.id === variantCartId);
        if (existing) {
          return prev.map((item) =>
            item.id === variantCartId ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prev, {
          id: variantCartId,
          name: displayName,
          price: result.price,
          category: "scanned",
          inStock: true,
          image: result.image,
          translations: result.translations,
          quantity: 1,
          variantOptions: Object.values(result.optionCombo),
        }];
      });
      showScanFeedback("success", t(locale, "scanAdded").replace("{name}", displayName));
    } else {
      // Product — if it has variants, open picker; otherwise add directly
      const displayName =
        (result.translations && result.translations[locale]) || result.name;
      if (result.hasVariants) {
        const product: Product = {
          id: result.productId,
          name: result.name,
          price: result.price,
          category: "scanned",
          inStock: true,
          image: result.image,
          hasVariants: true,
          translations: result.translations,
        };
        addToCart(product);
      } else {
        setAddedId(result.productId);
        setTimeout(() => setAddedId(null), 300);
        setCart((prev) => {
          const existing = prev.find((item) => item.id === result.productId);
          if (existing) {
            return prev.map((item) =>
              item.id === result.productId ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...prev, {
            id: result.productId,
            name: result.name,
            price: result.price,
            category: "scanned",
            inStock: true,
            image: result.image,
            translations: result.translations,
            quantity: 1,
          }];
        });
      }
      showScanFeedback("success", t(locale, "scanAdded").replace("{name}", displayName));
    }
  }, [addToCart, locale, showScanFeedback]);

  useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: mounted && !locked && !showCheckout,
  });

  // Global keyboard shortcuts (POS-wide)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Skip if locked, in checkout, or typing in an input
      if (locked || showCheckout || !shiftId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      // Enter → open checkout (when cart has items)
      if (e.key === "Enter" && cart.length > 0 && activeTab === "cashier") {
        e.preventDefault();
        setShowCheckout(true);
      }
      // F8 → lock screen
      if (e.key === "F8") {
        e.preventDefault();
        handleLockScreen();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [locked, showCheckout, shiftId, cart.length, activeTab, handleLockScreen]);

  // Prevent hydration mismatch — locale/theme differ between server and client
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-pos-bg">
        <div className="h-8 w-8 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" />
      </div>
    );
  }

  // First-time catalog sync — show progress overlay
  if (catalog.syncStatus === "initial-sync" || catalog.syncStatus === "images") {
    return (
      <SyncOverlay
        progress={catalog.syncProgress}
        locale={locale}
        onSkip={() => {/* skip handled by hook timeout */}}
      />
    );
  }

  return (
    <>
    {/* Shift open gate — blocks POS until shift is started */}
    {!shiftId && mounted && (
      <ShiftOpenModal
        userName={userName || ""}
        terminalName={terminalName || null}
        terminalCode={terminalCode || null}
        onShiftOpened={(id) => setShiftId(id)}
        locale={locale}
        currency={currency}
      />
    )}

    {/* Lock screen overlay */}
    {locked && (
      <LockScreen
        userName={userName || ""}
        userAvatar={userAvatar || null}
        userId={userId || ""}
        pinHash={userPinHash || null}
        terminalName={terminalName || null}
        terminalCode={terminalCode || null}
        onUnlock={handleUnlock}
        onForceLogout={handleForceLogout}
        locale={locale}
      />
    )}
    <div
      className={`h-screen flex flex-col overflow-hidden bg-pos-bg transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${
        locking ? "blur-[32px] scale-[0.97] opacity-50" : locked ? "blur-[20px] scale-[0.98]" : "blur-0 scale-100 opacity-100"
      }`}
      style={{ transitionDuration: "650ms" }}
    >
      {/* ============ CASHIER TAB: Products + Cart ============ */}
      {activeTab === "cashier" && <div className="flex-1 flex overflow-hidden min-h-0">
      {/* ============ LEFT: PRODUCT AREA ============ */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Row 1: View tabs (Keypad / Library / Favorites) + Search */}
        <header className="h-[52px] flex items-center gap-1 px-5 bg-pos-surface border-b border-pos-border shrink-0">
          {/* View tabs */}
          <nav className="flex items-center gap-1">
            {([
              { key: "keypad" as const, label: t(locale, "keypad"), icon: Calculator },
              { key: "library" as const, label: t(locale, "library"), icon: LibraryBig },
              { key: "favorites" as const, label: t(locale, "favorites"), icon: Star },
            ]).map(({ key, label, icon: TabIcon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={cn(
                  "h-9 px-4 flex items-center gap-2 text-[15px] font-medium rounded-[var(--radius-sm)] transition-colors whitespace-nowrap",
                  activeView === key
                    ? "text-pos-text"
                    : "text-pos-text-muted hover:text-pos-text-secondary"
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search tags + search button */}
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none" ref={searchBtnRef}>
            {searchTags.map((tag, i) => (
              <div
                key={i}
                className="h-7 flex items-center gap-1 pl-2 pr-0.5 text-[12px] font-medium rounded-[var(--radius-full)] shrink-0"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--color-pos-accent) 12%, transparent)",
                  color: "var(--color-pos-accent)",
                }}
              >
                <span className="truncate max-w-[120px]">{tag}</span>
                <span
                  onClick={() => setSearchTags(prev => prev.filter((_, idx) => idx !== i))}
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${tag}`}
                  className="h-7 w-7 p-1 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </span>
              </div>
            ))}
            <button
              onClick={() => setSearchOpen(true)}
              aria-label={t(locale, "search")}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-pos-bg border border-pos-border text-pos-text-muted hover:bg-pos-surface-hover transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            <button
              onClick={() => setShowCameraScanner(true)}
              aria-label={t(locale, "scanBarcode")}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-pos-bg border border-pos-border text-pos-text-muted hover:bg-pos-surface-hover transition-colors"
            >
              <ScanLine className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Row 2: Category filter tabs (only in Library view) */}
        {activeView === "library" && (
          <>
            <div className="h-[48px] flex items-center gap-1.5 px-5 bg-pos-surface border-b border-pos-border shrink-0 overflow-x-auto hide-scrollbar">
              {catalog.categories.map((cat) => {
                const Icon = iconMap[cat.icon] || LayoutGrid;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setActiveCategory(cat.id);
                      setActiveSubCategory(null);
                      setSubRowExpanded(true);
                    }}
                    className={cn(
                      "flex items-center gap-1.5 px-3.5 h-8 rounded-[var(--radius-full)] text-[13px] font-medium whitespace-nowrap transition-all shrink-0",
                      isActive
                        ? "text-white shadow-sm"
                        : "text-pos-text-secondary bg-pos-bg hover:bg-pos-surface-active"
                    )}
                    style={isActive ? { backgroundColor: "var(--color-pos-accent)" } : undefined}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    {getProductName(cat, locale)}
                  </button>
                );
              })}
            </div>

            {/* Row 3: Sub-category pills (slide down when parent has children) */}
            <div
              className={cn(
                "overflow-hidden transition-[max-height,border-color] duration-300 ease-out shrink-0 border-b",
                activeChildren.length > 0 && subRowExpanded
                  ? "border-pos-border"
                  : "border-transparent"
              )}
              style={{ maxHeight: activeChildren.length > 0 && subRowExpanded ? 48 : 0 }}
            >
              <div className="h-[48px] flex items-center gap-1.5 px-5 bg-pos-surface overflow-x-auto hide-scrollbar">
                {/* Close button — collapse back to parent level */}
                <CloseButton
                  onClick={() => {
                    setActiveSubCategory(null);
                    setSubRowExpanded(false);
                  }}
                  className="shrink-0"
                  label={t(locale, "cancel")}
                />
                {activeChildren.map((sub) => {
                  const isActive = activeSubCategory === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubCategory(isActive ? null : sub.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 h-8 rounded-[var(--radius-full)] text-[13px] font-medium whitespace-nowrap transition-all shrink-0",
                        isActive
                          ? "bg-pos-accent/15 text-pos-accent"
                          : "text-pos-text-secondary bg-pos-bg hover:bg-pos-surface-active"
                      )}
                    >
                      {getProductName(sub, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ============ VIEW CONTENT ============ */}

        {/* Keypad view */}
        {activeView === "keypad" && (
          <KeypadView locale={locale} onAddToCart={addCustomToCart} currency={currency} />
        )}

        {/* Favorites view */}
        {activeView === "favorites" && (() => {
          const favProducts = catalog.products.filter(p => favoriteIds.has(p.id));
          return favProducts.length > 0 ? (
            <>
              <div className="px-5 py-3 flex items-center justify-between shrink-0">
                <span className="text-[13px] text-pos-text-secondary">
                  {favProducts.length} {t(locale, "favorites")}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-5">
                <ProductGrid
                  products={favProducts}
                  cart={cart}
                  addedId={addedId}
                  locale={locale}
                  currency={currency}
                  favoriteIds={favoriteIds}
                  onAdd={addToCart}
                  onLongPress={openProductPreview}
                  onToggleFavorite={toggleFavorite}

                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Star className="h-12 w-12 text-pos-text-muted/30 mx-auto mb-3" strokeWidth={1.25} />
                <p className="text-[15px] font-medium text-pos-text">{t(locale, "favorites")}</p>
                <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "favoritesDesc")}</p>
              </div>
            </div>
          );
        })()}

        {/* Library view — Product count */}
        {activeView === "library" && (
          <div className="px-5 py-3 flex items-center justify-between shrink-0">
            <span className="text-[13px] text-pos-text-secondary">
              {filtered.length} {t(locale, "items")}
            </span>
          </div>
        )}

        {/* Library view — Product grid */}
        {activeView === "library" && <div className="flex-1 overflow-y-auto px-5 pb-5">
          <ProductGrid
            products={filtered}
            cart={cart}
            addedId={addedId}
            locale={locale}
            currency={currency}
            favoriteIds={favoriteIds}
            onAdd={addToCart}
            onLongPress={openProductPreview}
            onToggleFavorite={toggleFavorite}

          />

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <Search className="h-10 w-10 text-pos-text-muted/40 mb-3" strokeWidth={1.25} />
              <p className="text-[15px] font-medium text-pos-text">{t(locale, "noResults")}</p>
              <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "tryOther")}</p>
            </div>
          )}
        </div>}
      </main>
      {/* ============ RIGHT: CART + PAYMENT ============ */}
      <aside className="w-[360px] bg-pos-cart-bg border-l border-pos-border flex flex-col shrink-0 shadow-[-1px_0_3px_rgba(0,0,0,0.04)]">
        {/* Cart header — aligned with main pane row 1 */}
        <div className="h-[52px] flex items-center justify-between px-5 bg-pos-cart-header border-b border-pos-border shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-[18px] w-[18px] text-pos-text-secondary" />
            <h3 className="text-[15px] font-semibold text-pos-text">{t(locale, "cart")}</h3>
            {itemCount > 0 && (
              <span
                className="text-[11px] font-bold text-white min-w-[20px] h-5 flex items-center justify-center px-1.5 rounded-[var(--radius-full)]"
                style={{ backgroundColor: "var(--color-pos-accent)" }}
              >
                {itemCount}
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              aria-label={t(locale, "clear")}
              className="text-[13px] text-pos-text-muted hover:text-pos-danger transition-colors"
            >
              {t(locale, "clear")}
            </button>
          )}
        </div>

        {/* Customer awareness bar — fixed height prevents layout shift */}
        <div className="h-[64px] flex items-center px-5 border-b border-pos-border shrink-0">
          {linkedCustomer ? (
            <>
              <button
                onClick={() => setShowCustomerDetail(true)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <Avatar src={linkedCustomer.avatar} name={linkedCustomer.name} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-pos-text">{linkedCustomer.name}</p>
                  {linkedCustomer.tier && (
                    <p className="text-[12px] text-pos-text-muted mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {linkedCustomer.tier}
                      </span>
                      {linkedCustomer.points !== undefined && (
                        <span> · {linkedCustomer.points.toLocaleString()} pts</span>
                      )}
                    </p>
                  )}
                </div>
              </button>
              <button
                onClick={() => setLinkedCustomer(null)}
                className="h-7 w-7 flex items-center justify-center rounded-full text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-light transition-colors shrink-0 ml-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowCustomerSearch(true)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[13px] text-pos-text-muted hover:text-pos-text-secondary transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              {t(locale, "addCustomer")}
            </button>
          )}
        </div>

        {/* Screen reader announcement for cart changes */}
        <div aria-live="polite" className="sr-only">
          {itemCount > 0
            ? `${itemCount} ${t(locale, "items")}, ${t(locale, "total")} ${currency} ${subtotal.toFixed(2)}`
            : t(locale, "emptyCart")}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-5">
              <div className="h-16 w-16 rounded-full bg-pos-bg flex items-center justify-center mb-4">
                <ShoppingBag className="h-7 w-7 text-pos-text-muted/50" strokeWidth={1.25} />
              </div>
              <p className="text-[15px] font-medium text-pos-text-secondary">{t(locale, "emptyCart")}</p>
              <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "tapToAdd")}</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {cart.map((item) => {
                const cartName = getProductName(item, locale);
                const brand = item.brand || null;
                const shortName = cartName;
                const isNew = !knownCartIdsRef.current.has(item.id);
                if (isNew) knownCartIdsRef.current.add(item.id);
                return (
                <div
                  key={item.id}
                  onClick={() => setDiscountItemId(discountItemId === item.id ? null : item.id)}
                  className={cn(
                    "p-3 rounded-[var(--radius-md)] bg-pos-surface border border-pos-border group relative cursor-pointer hover:border-pos-border-strong transition-colors",
                    isNew && "animate-slide-up"
                  )}
                >
                  {/* Row 1: Name + delete */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {brand && (
                        <p className="text-[9px] font-semibold text-pos-text-muted uppercase tracking-wide">{brand}</p>
                      )}
                      <p className="text-[13px] font-medium text-pos-text leading-snug" title={cartName}>
                        {brand ? shortName : cartName}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                      aria-label={`Remove ${item.name}`}
                      className="h-6 w-6 p-2 box-content flex items-center justify-center text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-light rounded-full transition-all shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Row 2: Variant chips */}
                  {item.variantOptions && item.variantOptions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.variantOptions.map((opt, ci) => (
                        <span key={ci} className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium text-pos-text-secondary bg-pos-bg border border-pos-border rounded-[var(--radius-full)]">
                          {opt}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Per-item discount badge */}
                  {item.discount && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[11px] font-medium text-pos-danger">
                        {t(locale, "discount")}: {item.discount.type === "percent" ? `${item.discount.value}%` : `${currency} ${item.discount.value}`}
                        {" "}(-{currency} {(item.price * item.quantity - itemLineTotal(item)).toFixed(1)})
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); applyItemDiscount(item.id, null); }}
                        className="h-4 w-4 flex items-center justify-center rounded-full text-pos-text-muted hover:text-pos-danger transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Row 3: Stepper + total */}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center bg-pos-bg rounded-[var(--radius-md)] border border-pos-border">
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, -1); }}
                        aria-label={`Decrease ${item.name}`}
                        className="h-11 w-11 flex items-center justify-center text-pos-text-secondary hover:text-pos-text active:bg-pos-surface-hover transition-colors rounded-l-[var(--radius-md)]"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-[15px] font-bold text-pos-text tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); updateQuantity(item.id, 1); }}
                        aria-label={`Increase ${item.name}`}
                        className="h-11 w-11 flex items-center justify-center text-pos-text-secondary hover:text-pos-text active:bg-pos-surface-hover transition-colors rounded-r-[var(--radius-md)]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[14px] font-bold tabular-nums", item.discount ? "text-pos-danger" : "text-pos-text")}>
                        {t(locale, "total")} {currency} {itemLineTotal(item).toFixed(1)}
                      </p>
                      {(item.quantity > 1 || item.discount) && (
                        <p className="text-[10px] text-pos-text-muted tabular-nums">
                          {currency} {item.price.toFixed(1)} × {item.quantity}
                        </p>
                      )}
                    </div>
                  </div>

                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer: Totals + Charge button */}
        <div className="border-t border-pos-border p-5 space-y-3 shrink-0 bg-pos-cart-header">
          {/* Subtotal */}
          <div className="flex items-center justify-between text-[13px]">
            <span className="text-pos-text-secondary">{t(locale, "subtotal")}</span>
            <span className="font-medium text-pos-text tabular-nums">{currency} {subtotal.toFixed(2)}</span>
          </div>

          {/* Discount row — fixed height, always occupies space */}
          <div className="h-[24px] flex items-center">
            {orderDiscount ? (
              <div className="flex items-center justify-between w-full text-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-pos-danger">
                    {t(locale, "discount")} ({orderDiscount.type === "percent" ? `${orderDiscount.value}%` : `${currency} ${orderDiscount.value}`})
                  </span>
                  <button onClick={() => setOrderDiscount(null)} className="h-5 w-5 flex items-center justify-center rounded-full text-pos-text-muted hover:text-pos-danger transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <span className="font-medium text-pos-danger tabular-nums">-{currency} {discountAmount.toFixed(2)}</span>
              </div>
            ) : cart.length > 0 ? (
              <button
                onClick={() => setShowDiscountPopover(true)}
                className="w-full h-full flex items-center text-[13px] text-pos-text-muted hover:text-pos-accent transition-colors"
              >
                + {t(locale, "addDiscount")}
              </button>
            ) : null}
          </div>

          {/* Tax row — fixed height */}
          {taxRate > 0 && (
            <div className="h-[20px] flex items-center justify-between text-[13px]">
              {cart.length > 0 ? (
                <>
                  <span className="text-pos-text-secondary">{t(locale, "tax")} ({taxRate}%)</span>
                  <span className="font-medium text-pos-text tabular-nums">{currency} {taxAmount.toFixed(2)}</span>
                </>
              ) : null}
            </div>
          )}

          {/* Charge button */}
          <button
            onClick={() => cart.length > 0 && setShowCheckout(true)}
            disabled={cart.length === 0}
            className={cn(
              "w-full h-[52px] flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold text-[16px] transition-all",
              cart.length > 0
                ? "text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                : "bg-pos-bg text-pos-text-muted cursor-not-allowed border border-pos-border"
            )}
            style={cart.length > 0 ? { backgroundColor: "var(--color-pos-accent)" } : undefined}
          >
            <CreditCard className="h-5 w-5" />
            {cart.length > 0 ? `${currency} ${total.toFixed(2)}` : t(locale, "charge")}
          </button>
        </div>
      </aside>
      </div>}

      {/* ============ ORDERS TAB ============ */}
      {activeTab === "orders" && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left sidebar */}
          <nav className="w-[220px] bg-pos-surface border-r border-pos-border shrink-0 flex flex-col">
            <div className="px-4 py-4">
              <h2 className="text-[16px] font-semibold text-pos-text">{t(locale, "orders")}</h2>
            </div>
            {([
              { key: "all" as const, label: t(locale, "allOrders"), icon: ClipboardList },
              { key: "pos" as const, label: t(locale, "posOrders"), icon: Store },
              { key: "online" as const, label: t(locale, "onlineOrders"), icon: Globe },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setOrderChannel(key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-left transition-colors",
                  orderChannel === key
                    ? "bg-pos-accent text-white"
                    : "text-pos-text-secondary hover:bg-pos-surface-hover"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right: order list */}
          <div className="flex-1 overflow-hidden">
            {orderChannel === "all" ? (
              <HistorySheet
                open={true}
                onClose={() => setActiveTab("cashier")}
                shiftId={shiftId}
                locale={locale}
                currency={currency}
                embedded
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {orderChannel === "pos" ? (
                  <Store className="h-12 w-12 text-pos-text-muted/30 mb-3" strokeWidth={1.25} />
                ) : (
                  <Globe className="h-12 w-12 text-pos-text-muted/30 mb-3" strokeWidth={1.25} />
                )}
                <p className="text-[15px] font-medium text-pos-text">
                  {orderChannel === "pos" ? t(locale, "posOrders") : t(locale, "onlineOrders")}
                </p>
                <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "comingSoon")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ REPORTS TAB ============ */}
      {activeTab === "reports" && (
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left sidebar */}
          <nav className="w-[220px] bg-pos-surface border-r border-pos-border shrink-0 flex flex-col">
            <div className="px-4 py-4">
              <h2 className="text-[16px] font-semibold text-pos-text">{t(locale, "reportsTab")}</h2>
            </div>
            {([
              { key: "drawer" as const, label: t(locale, "drawerReport"), icon: Wallet },
              { key: "sales" as const, label: t(locale, "salesReport"), icon: TrendingUp },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setReportView(key)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-[14px] font-medium text-left transition-colors",
                  reportView === key
                    ? "bg-pos-accent text-white"
                    : "text-pos-text-secondary hover:bg-pos-surface-hover"
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                {label}
              </button>
            ))}
          </nav>

          {/* Right content */}
          <div className="flex-1 overflow-y-auto bg-pos-bg">
            {reportView === "drawer" && (
              <div className="p-6">
                {shiftId ? (
                  <DrawerLedger shiftId={shiftId} locale={locale} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Wallet className="h-12 w-12 text-pos-text-muted/30 mb-3" strokeWidth={1.25} />
                    <p className="text-[15px] font-medium text-pos-text">{t(locale, "drawerReport")}</p>
                    <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "startShiftToSeeDrawer")}</p>
                  </div>
                )}
              </div>
            )}

            {reportView === "sales" && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <TrendingUp className="h-12 w-12 text-pos-text-muted/30 mb-3" strokeWidth={1.25} />
                <p className="text-[15px] font-medium text-pos-text">{t(locale, "salesReport")}</p>
                <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "comingSoon")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Shift Summary Panel */}
      {showShiftSummary && shiftId && (
        <ShiftSummaryPanel
          shiftId={shiftId}
          onClose={() => setShowShiftSummary(false)}
          onEndShift={() => { setShowShiftSummary(false); setShowShiftClose(true); }}
          locale={locale}
          currency={currency}
        />
      )}

      {/* Shift Close Modal */}
      {showShiftClose && shiftId && (
        <ShiftCloseModal
          shiftId={shiftId}
          onClose={() => setShowShiftClose(false)}
          locale={locale}
          currency={currency}
          userName={userName}
          userAvatar={userAvatar}
          onShiftClosed={() => {
            setShowShiftClose(false);
            sessionStorage.removeItem("pos-locked");
            sessionStorage.removeItem("pos-images-cached");
            window.stop(); fetch("/api/logout", { method: "POST" }).catch(() => {}); window.location.replace("/login");
          }}
        />
      )}

      {/* ============ BOTTOM BAR (full width) ============ */}
      <div className="h-[48px] flex items-center gap-1.5 px-5 bg-pos-surface border-t border-pos-border shrink-0">
        {/* User menu */}
        {userName && (
          <div className="relative">
            <button
              onClick={() => { setShowSettingsMenu(!showSettingsMenu); setMenuLevel("main"); }}
              className={cn(
                "h-9 px-3 flex items-center gap-2 text-[13px] border rounded-[var(--radius-sm)] shrink-0 transition-colors",
                shiftId
                  ? "text-pos-text-secondary border-pos-accent/30 bg-pos-accent-light hover:bg-pos-accent-light/80"
                  : "text-pos-text-secondary border-pos-border bg-pos-surface hover:bg-pos-surface-hover"
              )}
            >
              <div className="relative">
                <Avatar src={userAvatar} name={userName} size={24} />
                {shiftId && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-pos-surface" />}
              </div>
              <span className="hidden lg:inline max-w-[100px] truncate">{userName}</span>
              {shiftId && <ShiftTimer shiftId={shiftId} />}
            </button>

            {showSettingsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettingsMenu(false)} />
                <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-pos-surface border border-pos-border rounded-[var(--radius-md)] shadow-lg py-1.5 min-w-[220px] animate-scale-in">
                  {shiftId && (
                    <>
                      <button onClick={() => { setShowSettingsMenu(false); setShowShiftSummary(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left text-pos-text-secondary hover:bg-pos-surface-hover transition-colors">
                        <Clock className="h-4 w-4" /><span>{t(locale, "shiftSummary")}</span>
                      </button>
                      <button onClick={() => { setShowSettingsMenu(false); setShowShiftClose(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left text-pos-text-secondary hover:bg-pos-surface-hover transition-colors">
                        <Receipt className="h-4 w-4" /><span>{t(locale, "shiftCloseBtn")}</span>
                      </button>
                      <div className="my-1.5 border-t border-pos-border" />
                    </>
                  )}
                  <div className="relative">
                    <button onClick={() => setMenuLevel(menuLevel === "theme" ? "main" : "theme")} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors", menuLevel === "theme" ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover")}>
                      <Palette className="h-4 w-4" /><span>{t(locale, "theme")}</span>
                      <div className="ml-auto flex items-center gap-1.5"><div className="h-3.5 w-3.5 rounded-full border border-pos-border" style={{ backgroundColor: merchantThemes[currentTheme]?.accent }} /><ChevronRight className="h-3.5 w-3.5 text-pos-text-muted" /></div>
                    </button>
                    {menuLevel === "theme" && (
                      <div className="absolute left-full top-0 ml-1 z-20 bg-pos-surface border border-pos-border rounded-[var(--radius-md)] shadow-lg py-1.5 min-w-[180px] animate-fade-in">
                        {Object.entries(merchantThemes).map(([key, theme]) => (
                          <button key={key} onClick={() => { setCurrentTheme(key); setMenuLevel("main"); }} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors", currentTheme === key ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover")}>
                            <div className="h-4 w-4 rounded-full border border-pos-border" style={{ backgroundColor: theme.accent }} /><span>{theme.name}</span>
                            {currentTheme === key && <Check className="h-3.5 w-3.5 ml-auto text-pos-accent" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => setMenuLevel(menuLevel === "language" ? "main" : "language")} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors", menuLevel === "language" ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover")}>
                      <Languages className="h-4 w-4" /><span>{t(locale, "language")}</span>
                      <div className="ml-auto flex items-center gap-1.5"><Flag code={locale} size={14} /><ChevronRight className="h-3.5 w-3.5 text-pos-text-muted" /></div>
                    </button>
                    {menuLevel === "language" && (
                      <div className="absolute left-full top-0 ml-1 z-20 bg-pos-surface border border-pos-border rounded-[var(--radius-md)] shadow-lg py-1.5 min-w-[180px] animate-fade-in">
                        {(Object.keys(localeNames) as Locale[]).map((l) => (
                          <button key={l} onClick={() => { setLocale(l); setMenuLevel("main"); }} className={cn("w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors", locale === l ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover")}>
                            <Flag code={l} size={18} /><span>{localeNames[l]}</span>
                            {locale === l && <Check className="h-3.5 w-3.5 ml-auto text-pos-accent" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="my-1.5 border-t border-pos-border" />
                  <button onClick={() => { setShowSettingsMenu(false); setShowReloadConfirm(true); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left text-pos-text-secondary hover:bg-pos-surface-hover transition-colors">
                    <RefreshCw className="h-4 w-4" /><span>{t(locale, "update")}</span>
                  </button>
                  <button onClick={() => { setShowSettingsMenu(false); handleLockScreen(); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left text-pos-text-secondary hover:bg-pos-surface-hover transition-colors">
                    <Lock className="h-4 w-4" /><span>{t(locale, "lock")}</span>
                  </button>
                  <button disabled={locking} onClick={() => { setShowSettingsMenu(false); if (locking) return; setLocking(true); sessionStorage.removeItem("pos-locked"); fetch("/api/logout", { method: "POST" }).catch(() => {}); window.location.href = "/login"; }} className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left text-pos-danger hover:bg-pos-danger-light transition-colors disabled:opacity-50">
                    <LogOut className="h-4 w-4" /><span>{t(locale, "logout")}</span>
                  </button>
                  <div className="my-1.5 border-t border-pos-border" />
                </div>
              </>
            )}

          </div>
        )}

        {/* Nav tabs */}
        <nav className="flex items-center gap-20 ml-10">
          {([
            { key: "cashier" as const, label: t(locale, "cashierTab"), icon: Monitor },
            { key: "orders" as const, label: t(locale, "orders"), icon: ClipboardList },
            { key: "reports" as const, label: t(locale, "reportsTab"), icon: BarChart3 },
          ]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "h-9 flex items-center gap-2 text-[13px] font-semibold transition-colors",
                activeTab === key
                  ? "text-pos-accent"
                  : "text-pos-text-muted hover:text-pos-text-secondary"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Pending orders count */}
        {pendingCount > 0 && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
            {pendingCount} {t(locale, "pendingOrders")}
          </span>
        )}

        {/* Terminal name + connection indicator (right) */}
        <div className="flex items-center gap-2 shrink-0">
          {terminalName && <span className="text-[11px] text-pos-text-muted">{terminalName}</span>}
          <button
            onClick={async () => {
              setCheckingConnection(true);
              try {
                const res = await fetch("/api/ping", { cache: "no-store" });
                if (res.ok && getPendingCount() > 0) {
                  await syncPendingOrders();
                  setPendingCount(getPendingCount());
                }
              } catch { /* offline */ }
              setCheckingConnection(false);
            }}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-full border transition-colors",
              checkingConnection
                ? "text-pos-text-muted border-pos-border"
                : isOnline
                ? "text-pos-success border-pos-success/20 bg-pos-success/5 hover:bg-pos-success/10"
                : "text-pos-danger border-pos-danger/20 bg-pos-danger-light hover:bg-pos-danger/10"
            )}
          >
            {checkingConnection ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isOnline ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {/* Confirm unfavorite */}
      <ConfirmDialog
        open={!!confirmUnfavorite}
        onClose={() => setConfirmUnfavorite(null)}
        onConfirm={confirmRemoveFavorite}
        icon={<Star className="h-10 w-10 text-amber-500 fill-amber-500 mx-auto" />}
        title={t(locale, "removeFavoriteTitle")}
        message={t(locale, "removeFavoriteHint")}
        cancelLabel={t(locale, "cancel")}
        confirmLabel={t(locale, "confirm")}
      />

      <ConfirmDialog
        open={showReloadConfirm}
        onClose={() => { if (!reloading) setShowReloadConfirm(false); }}
        onConfirm={async () => {
          setReloading(true);
          try {
            const res = await fetch("/api/ping", { cache: "no-store", signal: AbortSignal.timeout(3000) });
            if (res.ok) {
              window.location.reload();
              return;
            }
          } catch { /* no connection */ }
          setReloading(false);
          setShowReloadConfirm(false);
        }}
        icon={
          reloading
            ? <Loader2 className="h-10 w-10 text-[#007aff] mx-auto animate-spin" />
            : <RefreshCw className="h-10 w-10 text-[#007aff] mx-auto" />
        }
        title={t(locale, "lockReloadTitle")}
        message={reloading ? t(locale, "lockReloadChecking") : t(locale, "lockReloadMessage")}
        cancelLabel={t(locale, "lockReloadCancel")}
        confirmLabel={t(locale, "lockReloadConfirm")}
        variant="primary"
        loading={reloading}
      />

      {/* Per-item discount popover */}
      {discountItemId && cart.find(i => i.id === discountItemId) && (
        <DiscountPopover
          locale={locale}
          currency={currency}
          subtotal={(cart.find(i => i.id === discountItemId)!.price * cart.find(i => i.id === discountItemId)!.quantity)}
          onApply={(d) => applyItemDiscount(discountItemId, d)}
          onClose={() => setDiscountItemId(null)}
        />
      )}

      {/* Order-level discount popover */}
      {showDiscountPopover && (
        <DiscountPopover
          locale={locale}
          currency={currency}
          subtotal={subtotal}
          onApply={setOrderDiscount}
          onClose={() => setShowDiscountPopover(false)}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          locale={locale}
          currency={currency}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
          customerId={linkedCustomer?.id}
          subtotal={subtotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          taxRate={taxRate}
          total={total}
          orderDiscount={orderDiscount}
          isOnline={isOnline}
        />
      )}


      {/* ============ CAMERA BARCODE SCANNER ============ */}
      {showCameraScanner && (
        <CameraScanner
          locale={locale}
          onScan={(barcode) => {
            setShowCameraScanner(false);
            handleBarcodeScan(barcode);
          }}
          onClose={() => setShowCameraScanner(false)}
        />
      )}

      {/* ============ SCAN FEEDBACK BANNER ============ */}
      <ScanFeedback state={scanFeedback} onDone={() => setScanFeedback(null)} />

      {/* ============ CUSTOMER SEARCH SPOTLIGHT ============ */}
      {showCustomerSearch && (
        <CustomerSearchSpotlight
          locale={locale}
          onClose={() => setShowCustomerSearch(false)}
          onSelect={(c) => setLinkedCustomer(c)}
        />
      )}

      {/* ============ CUSTOMER DETAIL SHEET ============ */}
      {showCustomerDetail && linkedCustomer && (
        <CustomerDetailSheet
          customer={linkedCustomer}
          locale={locale}
          onClose={() => setShowCustomerDetail(false)}
          onRemove={() => setLinkedCustomer(null)}
        />
      )}

      {/* ============ SEARCH SPOTLIGHT ============ */}
      {searchOpen && (
        <ProductSearchSpotlight
          locale={locale}
          searchTags={searchTags}
          setSearchTags={setSearchTags}
          input={spotlightInput}
          setInput={setSpotlightInput}
          filtered={filtered}
          addToCart={addToCart}
          onClose={() => { setSpotlightInput(""); setSearchOpen(false); }}
        />
      )}

      {/* Variant picker */}
      {variantPickerOpen && variantProduct && (
        <VariantPicker
          open={variantPickerOpen}
          onClose={() => { setVariantPickerOpen(false); setVariantProduct(null); }}
          productName={getProductName(variantProduct, locale)}
          productImage={variantProduct.image}
          basePrice={variantProduct.price}
          loading={variantLoading}
          options={variantOptions}
          variants={variantItems}
          onSelect={handleVariantSelect}
          onAddDirect={!variantProduct.hasVariants ? () => addToCart(variantProduct) : undefined}
          locale={locale}
          currency={currency}
        />
      )}

      {/* Order History Sheet */}
      <HistorySheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        shiftId={shiftId}
        locale={locale}
        currency={currency}
      />
    </div>
    </>
  );
}


