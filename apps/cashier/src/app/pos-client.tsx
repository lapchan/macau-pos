"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import { type CartItem, type Product } from "@/data/mock";

export type CategoryData = {
  id: string;
  nameKey: string;
  icon: string;
};

export type ProductData = Product;
import { type Locale, localeNames, t, getProductName } from "@/i18n/locales";
import { Flag } from "@/components/shared/flags";
import { merchantThemes, applyTheme } from "@/lib/theme";
// logout handled via cookie deletion + redirect
import CheckoutModal from "@/components/checkout/checkout-modal";
import VariantPicker, { type VariantOption, type VariantItem } from "@/components/variant-picker";
import HistorySheet from "@/components/history/history-sheet";
import { fetchProductVariants } from "@/lib/actions";
import {
  LayoutGrid, Coffee, Cookie, Snowflake, Milk, Home, Heart, Flame,
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard,
  User, X, Languages, Check, Settings, Calculator, Star, LibraryBig, Delete, StickyNote,
  ChevronDown, Palette, LogOut, Lock, Clock, Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid, Coffee, Cookie, Snowflake, Milk, Home, Heart, Flame,
};

import ShiftOpenModal from "@/components/shift/shift-open-modal";
import ShiftCloseModal from "@/components/shift/shift-close-modal";
import ShiftSummaryPanel from "@/components/shift/shift-summary-panel";

// Live shift duration timer — updates every minute
function ShiftTimer({ shiftId }: { shiftId: string }) {
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    // Fetch shift openedAt once, then tick locally
    let openedAt: number | null = null;
    import("@/lib/shift-actions").then(({ getActiveShift }) =>
      getActiveShift().then((s) => {
        if (s) openedAt = new Date(s.openedAt).getTime();
      })
    );
    const tick = () => {
      if (!openedAt) return;
      const mins = Math.floor((Date.now() - openedAt) / 60000);
      if (mins < 60) setElapsed(`${mins}m`);
      else setElapsed(`${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}m` : ""}`);
    };
    tick();
    const iv = setInterval(tick, 30000); // update every 30s
    return () => clearInterval(iv);
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
  userId?: string | null;
  terminalName?: string | null;
  terminalCode?: string | null;
  activeShiftId?: string | null;
};

export default function POSClient({ initialProducts, initialCategories, userName, userId, terminalName, terminalCode, activeShiftId }: Props) {
  const [locale, setLocale] = useState<Locale>("tc");
  const [activeView, setActiveView] = useState<"library" | "keypad" | "favorites">("library");
  const [keypadValue, setKeypadValue] = useState("0");
  const [keypadNote, setKeypadNote] = useState("");
  const [showKeypadNote, setShowKeypadNote] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [spotlightInput, setSpotlightInput] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [addedId, setAddedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [locking, setLocking] = useState(false);
  const [shiftId, setShiftId] = useState<string | null>(activeShiftId || null);
  const [showShiftSummary, setShowShiftSummary] = useState(false);
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
    setMounted(true);
  }, []);

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
    window.fetch("/api/logout", { method: "POST" }).finally(() => {
      window.location.href = "/login";
    });
  }, []);

  // Extract brand from product name (common prefixes)
  const KNOWN_BRANDS = ["SAVEWO", "Savewo", "HEALTHCHAIR", "Chiikawa", "QMSV", "EVANGELION"];
  function extractBrand(name: string): { brand: string | null; shortName: string } {
    for (const brand of KNOWN_BRANDS) {
      if (name.startsWith(brand)) {
        const rest = name.slice(brand.length).replace(/^\s+/, "").replace(/^[-·]\s*/, "");
        return { brand, shortName: rest || name };
      }
    }
    return { brand: null, shortName: name };
  }

  const filtered = useMemo(() => {
    let list = initialProducts;
    if (activeCategory === "popular") {
      list = list.filter((p) => p.popular);
    } else if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
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
  }, [initialProducts, activeCategory, searchTags, spotlightInput]);

  // Keypad helpers — value stored as cents (integer string)
  const handleKeypadPress = useCallback((key: string) => {
    setKeypadValue(prev => {
      if (key === "C") return "0";
      if (key === "⌫") {
        const next = prev.slice(0, -1);
        return next === "" ? "0" : next;
      }
      if (prev === "0") return key;
      if (prev.length >= 8) return prev; // max 999,999.99
      return prev + key;
    });
  }, []);

  const keypadDisplayPrice = useMemo(() => {
    const cents = parseInt(keypadValue, 10);
    return (cents / 100).toFixed(2);
  }, [keypadValue]);

  const handleKeypadAddToCart = useCallback(() => {
    const cents = parseInt(keypadValue, 10);
    if (cents <= 0) return;
    const price = cents / 100;
    const customId = `custom_${Date.now()}`;
    const customProduct: Product = {
      id: customId,
      name: keypadNote || t(locale, "customItem"),
      price,
      category: "custom",
      inStock: true,
    };
    setCart(prev => [...prev, { ...customProduct, quantity: 1 }]);
    setKeypadValue("0");
    setKeypadNote("");
  }, [keypadValue, keypadNote, locale]);

  const addToCart = useCallback((product: Product) => {
    if (!product.inStock) return;

    // If product has variants, open variant picker instead of adding directly
    if (product.hasVariants) {
      setVariantProduct(product);
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
        .catch(console.error)
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

  const clearCart = useCallback(() => setCart([]), []);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutComplete = useCallback((orderNumber: string) => {
    setCart([]);
    setShowCheckout(false);
  }, []);

  // Prevent hydration mismatch — locale/theme differ between server and client
  if (!mounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-pos-bg">
        <div className="h-8 w-8 border-2 border-pos-accent/30 border-t-pos-accent rounded-full animate-spin" />
      </div>
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
      />
    )}

    {/* Lock screen overlay */}
    {locked && (
      <LockScreen
        userName={userName || ""}
        userId={userId || ""}
        terminalName={terminalName || null}
        terminalCode={terminalCode || null}
        onUnlock={handleUnlock}
        onForceLogout={handleForceLogout}
      />
    )}
    <div
      className={`h-screen flex overflow-hidden bg-pos-bg transition-all ease-[cubic-bezier(0.16,1,0.3,1)] ${
        locking ? "blur-[32px] scale-[0.97] opacity-50" : locked ? "blur-[20px] scale-[0.98]" : "blur-0 scale-100 opacity-100"
      }`}
      style={{ transitionDuration: "650ms" }}
    >
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
                  className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
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
          </div>
        </header>

        {/* Row 2: Category filter tabs (only in Library view) */}
        {activeView === "library" && (
          <div className="h-[48px] flex items-center gap-1.5 px-5 bg-pos-surface border-b border-pos-border shrink-0 overflow-x-auto hide-scrollbar">
            {initialCategories.map((cat) => {
              const Icon = iconMap[cat.icon] || LayoutGrid;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 h-8 rounded-[var(--radius-full)] text-[13px] font-medium whitespace-nowrap transition-all shrink-0",
                    isActive
                      ? "text-white shadow-sm"
                      : "text-pos-text-secondary bg-pos-bg hover:bg-pos-surface-active"
                  )}
                  style={isActive ? { backgroundColor: "var(--color-pos-accent)" } : undefined}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                  {t(locale, cat.nameKey as any)}
                </button>
              );
            })}
          </div>
        )}

        {/* ============ VIEW CONTENT ============ */}

        {/* Keypad view */}
        {activeView === "keypad" && (
          <div className="flex-1 flex flex-col px-8 py-6">
            {/* Price display */}
            <div className="flex-1 flex flex-col justify-center">
              <p className="text-[64px] font-bold text-pos-text tracking-tight text-left tabular-nums">
                <span className="text-[40px] text-pos-text-muted mr-1">MOP</span>
                {keypadDisplayPrice}
              </p>
              {keypadNote && (
                <p className="text-[15px] text-pos-text-muted mt-2 text-left truncate">{keypadNote}</p>
              )}
            </div>

            {/* Keypad grid */}
            <div className="grid grid-cols-3 gap-3 pb-2">
              {/* Row 1: + Note (full row) */}
              <button
                onClick={() => setShowKeypadNote(true)}
                className="h-[72px] col-span-3 flex items-center justify-center gap-2 text-[16px] font-medium text-pos-text-secondary rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
              >
                <StickyNote className="h-5 w-5" />
                {t(locale, "addNote")}
              </button>

              {/* Row 2–4: number keys 1-9 */}
              {["1","2","3","4","5","6","7","8","9"].map(n => (
                <button
                  key={n}
                  onClick={() => handleKeypadPress(n)}
                  className="h-[72px] flex items-center justify-center text-[28px] font-medium text-pos-text rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
                >
                  {n}
                </button>
              ))}

              {/* Row 5: C, 0, Add */}
              <button
                onClick={() => handleKeypadPress("C")}
                className="h-[72px] flex items-center justify-center text-[22px] font-semibold text-pos-text-muted rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
              >
                C
              </button>
              <button
                onClick={() => handleKeypadPress("0")}
                className="h-[72px] flex items-center justify-center text-[28px] font-medium text-pos-text rounded-[var(--radius-md)] bg-pos-bg hover:bg-pos-surface-hover active:scale-[0.97] transition-all"
              >
                0
              </button>
              <button
                onClick={handleKeypadAddToCart}
                disabled={parseInt(keypadValue, 10) <= 0}
                className="h-[72px] flex items-center justify-center text-[28px] font-semibold text-white rounded-[var(--radius-md)] active:scale-[0.97] transition-all disabled:opacity-40"
                style={{ backgroundColor: "var(--color-pos-accent)" }}
              >
                <Plus className="h-7 w-7" />
              </button>
            </div>

            {/* Note input modal */}
            {showKeypadNote && (
              <>
                <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowKeypadNote(false)} />
                <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-[400px] bg-pos-surface border border-pos-border rounded-[var(--radius-lg)] shadow-xl p-5 animate-scale-in">
                  <p className="text-[15px] font-semibold text-pos-text mb-3">{t(locale, "addNote")}</p>
                  <input
                    type="text"
                    autoFocus
                    value={keypadNote}
                    onChange={e => setKeypadNote(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") setShowKeypadNote(false); }}
                    placeholder={t(locale, "keypadNotePlaceholder")}
                    className="w-full h-11 px-3 text-[14px] text-pos-text bg-pos-bg border border-pos-border rounded-[var(--radius-md)] outline-none focus:border-pos-accent transition-colors"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => { setKeypadNote(""); setShowKeypadNote(false); }}
                      className="h-9 px-4 text-[13px] text-pos-text-secondary rounded-[var(--radius-md)] hover:bg-pos-surface-hover transition-colors"
                    >
                      {t(locale, "clear")}
                    </button>
                    <button
                      onClick={() => setShowKeypadNote(false)}
                      className="h-9 px-4 text-[13px] font-medium text-white rounded-[var(--radius-md)] transition-colors"
                      style={{ backgroundColor: "var(--color-pos-accent)" }}
                    >
                      {t(locale, "confirm")}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Favorites view */}
        {activeView === "favorites" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Star className="h-12 w-12 text-pos-text-muted/30 mx-auto mb-3" strokeWidth={1.25} />
              <p className="text-[15px] font-medium text-pos-text">{t(locale, "favorites")}</p>
              <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "favoritesDesc")}</p>
            </div>
          </div>
        )}

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {filtered.map((product) => {
              const inCart = cart.find((item) => item.id === product.id);
              const justAdded = addedId === product.id;
              const displayName = getProductName(product, locale);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={!product.inStock}
                  aria-label={`${displayName}, MOP ${product.price}`}
                  className={cn(
                    "relative flex flex-col p-2.5 rounded-[var(--radius-md)] border transition-all text-left group",
                    !product.inStock
                      ? "border-pos-border opacity-40 cursor-not-allowed bg-pos-surface"
                      : inCart
                      ? "border-pos-accent/30 bg-pos-accent-light shadow-sm"
                      : "border-pos-border bg-pos-surface hover:border-pos-border-strong hover:shadow-sm active:scale-[0.97]",
                    justAdded && "scale-[0.97]"
                  )}
                >
                  {/* Brand — fixed height, always occupies space */}
                  <p className="text-[10px] font-semibold text-pos-text-muted uppercase tracking-wide h-[14px] truncate">
                    {extractBrand(displayName).brand || "\u00A0"}
                  </p>

                  {/* Image area */}
                  <div className="relative w-full aspect-square rounded-[var(--radius-sm)] bg-pos-bg my-1.5 flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt="" className="h-full w-full object-contain" loading="lazy" />
                    ) : (
                      <ShoppingBag className="h-7 w-7 text-pos-text-muted/40" strokeWidth={1.25} />
                    )}
                    {inCart && (
                      <div className="absolute inset-0 rounded-[var(--radius-sm)]" style={{ backgroundColor: "color-mix(in srgb, var(--color-pos-accent) 15%, transparent)" }} />
                    )}
                  </div>

                  {/* Product name */}
                  <p className="text-[12px] font-medium text-pos-text leading-tight line-clamp-2" title={displayName}>
                    {extractBrand(displayName).shortName || displayName}
                  </p>

                  {/* Price row */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[16px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>
                      ${product.price.toFixed(product.price % 1 === 0 ? 0 : 1)}
                    </span>
                    {inCart && (
                      <span
                        className="text-[11px] font-semibold text-white px-2 py-0.5 rounded-[var(--radius-full)]"
                        style={{ backgroundColor: "var(--color-pos-accent)" }}
                      >
                        ×{inCart.quantity}
                      </span>
                    )}
                  </div>

                  {/* Variant indicator */}
                  {product.hasVariants && product.inStock && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-[var(--radius-full)] bg-pos-surface border border-pos-border text-pos-text-secondary">
                        {t(locale, "variants")}
                      </span>
                    </div>
                  )}

                  {/* Sold out */}
                  {!product.inStock && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)]">
                      <span className="text-[12px] font-medium text-pos-danger bg-white/90 px-3 py-1 rounded-[var(--radius-full)] shadow-sm">
                        {t(locale, "outOfStock")}
                      </span>
                    </div>
                  )}

                  {/* Popular */}
                  {product.popular && product.inStock && (
                    <div className="absolute top-2.5 right-2.5">
                      <Flame className="h-3.5 w-3.5 text-pos-warning" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
              <Search className="h-10 w-10 text-pos-text-muted/40 mb-3" strokeWidth={1.25} />
              <p className="text-[15px] font-medium text-pos-text">{t(locale, "noResults")}</p>
              <p className="text-[13px] text-pos-text-muted mt-1">{t(locale, "tryOther")}</p>
            </div>
          )}
        </div>}

        {/* ============ BOTTOM BAR: Settings & Controls ============ */}
        <div className="h-[48px] flex items-center gap-1.5 px-5 bg-pos-surface border-t border-pos-border shrink-0">
          {/* User button */}
          {userName && (
            <button
              onClick={shiftId ? () => setShowShiftSummary(true) : undefined}
              className={cn(
                "h-9 px-3 flex items-center gap-2 text-[13px] border rounded-[var(--radius-sm)] shrink-0 transition-colors",
                shiftId
                  ? "text-pos-text-secondary border-pos-accent/30 bg-pos-accent-light hover:bg-pos-accent-light/80 cursor-pointer"
                  : "text-pos-text-secondary border-pos-border bg-pos-surface"
              )}
            >
              <div className="relative">
                <div
                  className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
                  style={{ backgroundColor: "var(--color-pos-accent)" }}
                >
                  {userName.charAt(0).toUpperCase()}
                </div>
                {shiftId && (
                  <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-pos-surface" />
                )}
              </div>
              <span className="hidden lg:inline max-w-[100px] truncate">{userName}</span>
              {shiftId && <ShiftTimer shiftId={shiftId} />}
            </button>
          )}

          {/* Settings (theme + language) */}
          <div className="relative">
            <button
              onClick={() => { setShowSettingsMenu(!showSettingsMenu); }}
              aria-label="Settings"
              className="h-9 px-2.5 flex items-center gap-1.5 text-[13px] text-pos-text-secondary rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
            {showSettingsMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSettingsMenu(false)} />
                <div className="absolute left-0 bottom-full mb-1.5 z-20 bg-pos-surface border border-pos-border rounded-[var(--radius-md)] shadow-lg py-1.5 min-w-[200px] animate-scale-in">
                  {/* Theme section */}
                  <div className="px-3 py-1.5 text-[11px] font-medium text-pos-text-muted uppercase tracking-wide">
                    <div className="flex items-center gap-1.5"><Palette className="h-3 w-3" />{t(locale, "theme")}</div>
                  </div>
                  {Object.entries(merchantThemes).map(([key, theme]) => (
                    <button
                      key={key}
                      onClick={() => { setCurrentTheme(key); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors",
                        currentTheme === key ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover"
                      )}
                    >
                      <div className="h-4 w-4 rounded-full border border-pos-border" style={{ backgroundColor: theme.accent }} />
                      <span>{theme.name}</span>
                      {currentTheme === key && <Check className="h-3.5 w-3.5 ml-auto text-pos-accent" />}
                    </button>
                  ))}

                  {/* Divider */}
                  <div className="my-1.5 border-t border-pos-border" />

                  {/* Language section */}
                  <div className="px-3 py-1.5 text-[11px] font-medium text-pos-text-muted uppercase tracking-wide">
                    <div className="flex items-center gap-1.5"><Languages className="h-3 w-3" />{t(locale, "language")}</div>
                  </div>
                  {(Object.keys(localeNames) as Locale[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => { setLocale(l); }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors",
                        locale === l ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover"
                      )}
                    >
                      <Flag code={l} size={18} />
                      <span>{localeNames[l]}</span>
                      {locale === l && <Check className="h-3.5 w-3.5 ml-auto text-pos-accent" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Order history */}
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="h-9 px-2.5 flex items-center gap-1.5 text-[13px] text-pos-text-secondary rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors"
            aria-label={t(locale, "history") || "History"}
          >
            <Receipt className="h-4 w-4" />
          </button>

          <div className="flex-1" />

          {/* Lock screen */}
          <button
            type="button"
            aria-label="Lock screen"
            title="Lock screen"
            onClick={handleLockScreen}
            className="h-9 px-2.5 flex items-center gap-1.5 text-[13px] text-pos-text-secondary rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors"
          >
            <Lock className="h-4 w-4" />
          </button>

          {/* Logout */}
          <button
            type="button"
            aria-label="Logout"
            title="Logout"
            disabled={locking}
            onClick={() => {
              if (locking) return;
              setLocking(true);
              window.setTimeout(() => {
                window.fetch("/api/logout", { method: "POST" }).finally(() => {
                  window.location.href = "/login";
                });
              }, 700);
            }}
            className="h-9 px-2.5 flex items-center gap-1.5 text-[13px] text-pos-text-muted rounded-[var(--radius-sm)] hover:bg-pos-danger-light hover:text-pos-danger transition-colors disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Shift Summary Panel */}
      {showShiftSummary && shiftId && (
        <ShiftSummaryPanel
          shiftId={shiftId}
          onClose={() => setShowShiftSummary(false)}
          onEndShift={() => { setShowShiftSummary(false); setShowShiftClose(true); }}
          locale={locale}
        />
      )}

      {/* Shift Close Modal */}
      {showShiftClose && shiftId && (
        <ShiftCloseModal
          shiftId={shiftId}
          onClose={() => setShowShiftClose(false)}
          locale={locale}
          onShiftClosed={() => {
            setShowShiftClose(false);
            sessionStorage.removeItem("pos-locked");
            window.fetch("/api/logout", { method: "POST" }).finally(() => {
              window.location.href = "/login";
            });
          }}
        />
      )}

      {/* ============ RIGHT: CART + PAYMENT ============ */}
      <aside className="w-[360px] bg-pos-cart-bg border-l border-pos-border flex flex-col shrink-0 shadow-[-1px_0_3px_rgba(0,0,0,0.04)]">
        {/* Cart header */}
        <div className="h-[60px] flex items-center justify-between px-5 bg-pos-cart-header border-b border-pos-border shrink-0">
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

        {/* Screen reader announcement for cart changes */}
        <div aria-live="polite" className="sr-only">
          {itemCount > 0
            ? `${itemCount} ${t(locale, "items")}, ${t(locale, "total")} MOP ${subtotal.toFixed(2)}`
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
              {cart.map((item, idx) => {
                const cartName = getProductName(item, locale);
                const { brand, shortName } = extractBrand(cartName);
                return (
                <div
                  key={item.id}
                  className="p-3 rounded-[var(--radius-md)] bg-pos-surface border border-pos-border group animate-slide-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
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
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.name}`}
                      className="h-6 w-6 flex items-center justify-center text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-light rounded-full transition-all shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
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

                  {/* Row 3: Stepper + total */}
                  <div className="flex items-center justify-between mt-2.5">
                    <div className="flex items-center bg-pos-bg rounded-[var(--radius-md)] border border-pos-border">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        aria-label={`Decrease ${item.name}`}
                        className="h-10 w-10 flex items-center justify-center text-pos-text-secondary hover:text-pos-text active:bg-pos-surface-hover transition-colors rounded-l-[var(--radius-md)]"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-[15px] font-bold text-pos-text tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        aria-label={`Increase ${item.name}`}
                        className="h-10 w-10 flex items-center justify-center text-pos-text-secondary hover:text-pos-text active:bg-pos-surface-hover transition-colors rounded-r-[var(--radius-md)]"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-pos-text tabular-nums">
                        {t(locale, "total")} ${(item.price * item.quantity).toFixed(1)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-[10px] text-pos-text-muted tabular-nums">
                          MOP {item.price.toFixed(1)} × {item.quantity}
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

        {/* Footer: Totals + Payment */}
        <div className="border-t border-pos-border p-5 space-y-4 shrink-0 bg-pos-cart-header">
          {/* Totals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-pos-text-secondary">{t(locale, "subtotal")}</span>
              <span className="font-medium text-pos-text tabular-nums">
                MOP {subtotal.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-pos-border" />
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-pos-text">{t(locale, "total")}</span>
              <span className="text-[24px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>
                MOP {subtotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Charge button — opens checkout modal */}
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
            {t(locale, "charge")} {cart.length > 0 && `· MOP ${subtotal.toFixed(2)}`}
          </button>
        </div>
      </aside>

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          locale={locale}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      )}

      {/* ============ SEARCH SPOTLIGHT ============ */}
      {searchOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-50 bg-black/40 animate-[fadeIn_0.2s_ease-out]"
            onClick={() => {
              if (spotlightInput.trim()) setSearchTags(prev => [...prev, spotlightInput.trim()]);
              setSpotlightInput("");
              setSearchOpen(false);
            }}
          />
          {/* Search panel — centered, animated from button origin */}
          <div className="fixed inset-x-0 top-0 z-50 flex justify-center pt-[8vh] px-4 animate-[spotlightOpen_0.25s_cubic-bezier(0.16,1,0.3,1)]">
            <div className="w-full max-w-xl bg-pos-surface rounded-2xl shadow-2xl overflow-hidden relative">
              {/* Close button — circled × upper right (always visible) */}
              <button
                onClick={() => {
                  // Save current input as tag if non-empty
                  if (spotlightInput.trim()) {
                    setSearchTags(prev => [...prev, spotlightInput.trim()]);
                  }
                  setSpotlightInput("");
                  setSearchOpen(false);
                }}
                aria-label={t(locale, "cancel")}
                className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center rounded-full bg-pos-text-muted/15 text-pos-text-secondary hover:bg-pos-text-muted/25 hover:text-pos-text transition-colors z-10"
              >
                <X className="h-5 w-5" strokeWidth={2.5} />
              </button>

              {/* Active tags inside spotlight */}
              {searchTags.length > 0 && (
                <div className="flex items-center gap-1.5 px-5 pt-3 flex-wrap">
                  {searchTags.map((tag, i) => (
                    <div
                      key={i}
                      className="h-7 flex items-center gap-1 pl-2.5 pr-1 text-[12px] font-medium rounded-[var(--radius-full)]"
                      style={{
                        backgroundColor: "color-mix(in srgb, var(--color-pos-accent) 12%, transparent)",
                        color: "var(--color-pos-accent)",
                      }}
                    >
                      <span>{tag}</span>
                      <span
                        onClick={() => setSearchTags(prev => prev.filter((_, idx) => idx !== i))}
                        role="button"
                        tabIndex={0}
                        className="h-5 w-5 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Large search input */}
              <div className="flex items-center px-4">
                <Search className="h-5 w-5 text-pos-text-muted shrink-0 ml-1" />
                <input
                  type="text"
                  autoFocus
                  placeholder={searchTags.length > 0 ? t(locale, "addFilter") : t(locale, "search")}
                  aria-label={t(locale, "search")}
                  value={spotlightInput}
                  onChange={(e) => setSpotlightInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      if (spotlightInput.trim()) setSearchTags(prev => [...prev, spotlightInput.trim()]);
                      setSpotlightInput("");
                      setSearchOpen(false);
                    }
                    if (e.key === "Enter" && spotlightInput.trim()) {
                      setSearchTags(prev => [...prev, spotlightInput.trim()]);
                      setSpotlightInput("");
                    }
                    if (e.key === "Backspace" && !spotlightInput && searchTags.length > 0) {
                      setSearchTags(prev => prev.slice(0, -1));
                    }
                  }}
                  className="flex-1 h-14 pl-3 pr-12 text-[18px] bg-transparent text-pos-text placeholder:text-pos-text-muted outline-none border-none"
                  style={{ outline: "none" }}
                />
              </div>

              {/* Quick results preview */}
              {(spotlightInput || searchTags.length > 0) && (
                <div className="border-t border-pos-border max-h-[50vh] overflow-y-auto">
                  {filtered.length > 0 ? (
                    <div className="p-2">
                      {filtered.slice(0, 8).map((product) => {
                        const displayName = getProductName(product, locale);
                        const { brand, shortName } = extractBrand(displayName);
                        return (
                          <button
                            key={product.id}
                            onClick={() => {
                              addToCart(product);
                              if (!product.hasVariants) {
                                if (spotlightInput.trim()) setSearchTags(prev => [...prev, spotlightInput.trim()]);
                                setSpotlightInput("");
                                setSearchOpen(false);
                              }
                            }}
                            disabled={!product.inStock}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-left transition-colors",
                              product.inStock
                                ? "hover:bg-pos-surface-hover active:bg-pos-surface-active"
                                : "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <div className="h-10 w-10 rounded-[var(--radius-sm)] bg-pos-bg flex items-center justify-center shrink-0 overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <ShoppingBag className="h-4 w-4 text-pos-text-muted/40" strokeWidth={1.5} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              {brand && <p className="text-[9px] font-semibold text-pos-text-muted uppercase tracking-wide">{brand}</p>}
                              <p className="text-[14px] font-medium text-pos-text truncate">{brand ? shortName : displayName}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[14px] font-bold tabular-nums" style={{ color: "var(--color-pos-accent)" }}>
                                ${product.price.toFixed(product.price % 1 === 0 ? 0 : 1)}
                              </p>
                              {product.hasVariants && (
                                <p className="text-[10px] text-pos-text-muted">{t(locale, "variants")}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                      {filtered.length > 8 && (
                        <p className="text-center text-[12px] text-pos-text-muted py-2">
                          +{filtered.length - 8} more
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-[14px] text-pos-text-secondary">{t(locale, "noResults")}</p>
                      <p className="text-[12px] text-pos-text-muted mt-1">{t(locale, "tryOther")}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Variant picker */}
      {variantPickerOpen && variantProduct && (
        <VariantPicker
          open={variantPickerOpen}
          onClose={() => { setVariantPickerOpen(false); setVariantProduct(null); }}
          productName={getProductName(variantProduct, locale)}
          basePrice={variantProduct.price}
          options={variantLoading ? [] : variantOptions}
          variants={variantLoading ? [] : variantItems}
          onSelect={handleVariantSelect}
          locale={locale}
        />
      )}

      {/* Order History Sheet */}
      <HistorySheet
        open={showHistory}
        onClose={() => setShowHistory(false)}
        shiftId={shiftId}
        locale={locale}
      />
    </div>
    </>
  );
}

// ─── Lock Screen Component (iPhone-style) ──────────────────
function LockScreen({
  userName, userId, terminalName, terminalCode, onUnlock, onForceLogout,
}: {
  userName: string;
  userId: string;
  terminalName: string | null;
  terminalCode: string | null;
  onUnlock: () => void;
  onForceLogout: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [time, setTime] = useState(new Date());

  const MAX_ATTEMPTS = 5;

  // Clock
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && !verifying) {
      handleSubmit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  async function handleSubmit() {
    setVerifying(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("pin", pin);
      formData.append("userId", userId);

      const res = await fetch("/api/verify-pin", {
        method: "POST",
        body: JSON.stringify({ pin, userId }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.success) {
        onUnlock();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setShake(true);
        setTimeout(() => { setShake(false); setPin(""); }, 600);

        if (newAttempts >= MAX_ATTEMPTS) {
          setError("Too many attempts. Logging out...");
          setTimeout(onForceLogout, 1500);
        } else {
          setError(`Invalid PIN (${MAX_ATTEMPTS - newAttempts} attempts remaining)`);
        }
      }
    } catch {
      setError("Connection error. Try again.");
      setPin("");
    } finally {
      setVerifying(false);
    }
  }

  function handleDigit(d: string) {
    if (pin.length < 4 && !verifying) setPin((p) => p + d);
  }

  function handleDelete() {
    setPin((p) => p.slice(0, -1));
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xl">
      {/* Clock */}
      <div className="text-center mb-8">
        <p className="text-[#86868b] text-[14px] font-medium">{dateStr}</p>
        <p className="text-[#1d1d1f] text-[64px] font-extralight leading-none mt-1 tabular-nums tracking-tight">
          {hours}:{minutes}
        </p>
      </div>

      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-6">
        <div className="h-[64px] w-[64px] rounded-full flex items-center justify-center mb-3 shadow-lg" style={{ backgroundColor: "var(--color-pos-accent, #0071e3)" }}>
          <span className="text-white text-[24px] font-semibold">{initial}</span>
        </div>
        <p className="text-[#1d1d1f] text-[15px] font-medium">{userName}</p>
        {terminalName && (
          <p className="text-[#86868b] text-[12px] mt-1">
            {terminalCode ? `${terminalCode} · ` : ""}{terminalName}
          </p>
        )}
      </div>

      {/* PIN dots */}
      <div className="mb-8">
        <div className={`flex gap-[14px] justify-center ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-[13px] w-[13px] rounded-full transition-all duration-200 ${
                i < pin.length ? "bg-[#1d1d1f]" : "border-[1.5px] border-[#1d1d1f]/20"
              }`}
            />
          ))}
        </div>
        {error && (
          <p className="text-[#ff3b30] text-[12px] text-center mt-3 animate-fade-in">{error}</p>
        )}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-[12px]">
        {["1","2","3","4","5","6","7","8","9"].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDigit(d)}
            disabled={verifying || pin.length >= 4}
            className="h-[72px] w-[72px] rounded-full bg-[#f5f5f7] border border-black/[0.04] hover:bg-[#e8e8ed] active:bg-[#d1d1d6] flex flex-col items-center justify-center transition-all active:scale-[0.90] disabled:opacity-40"
          >
            <span className="text-[#1d1d1f] text-[26px] font-light leading-none">{d}</span>
            {({"2":"ABC","3":"DEF","4":"GHI","5":"JKL","6":"MNO","7":"PQRS","8":"TUV","9":"WXYZ"} as Record<string,string>)[d] && (
              <span className="text-[#86868b]/60 text-[8px] tracking-[0.16em] mt-[2px] font-medium">
                {({"2":"ABC","3":"DEF","4":"GHI","5":"JKL","6":"MNO","7":"PQRS","8":"TUV","9":"WXYZ"} as Record<string,string>)[d]}
              </span>
            )}
          </button>
        ))}
        <div className="h-[72px] w-[72px]" />
        <button
          type="button"
          onClick={() => handleDigit("0")}
          disabled={verifying || pin.length >= 4}
          className="h-[72px] w-[72px] rounded-full bg-[#f5f5f7] border border-black/[0.04] hover:bg-[#e8e8ed] active:bg-[#d1d1d6] flex items-center justify-center transition-all active:scale-[0.90] disabled:opacity-40"
        >
          <span className="text-[#1d1d1f] text-[26px] font-light">0</span>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pin.length === 0}
          className="h-[72px] w-[72px] rounded-full flex items-center justify-center text-[#86868b]/30 hover:text-[#86868b]/60 transition-all active:scale-[0.90] disabled:opacity-10"
        >
          <svg className="h-[22px] w-[22px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9.75L14.25 12m0 0l2.25 2.25M14.25 12l2.25-2.25M14.25 12L12 14.25m-2.58 4.92l-6.374-6.375a1.125 1.125 0 010-1.59L9.42 4.83c.21-.211.497-.33.795-.33H19.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25h-9.284c-.298 0-.585-.119-.795-.33z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

