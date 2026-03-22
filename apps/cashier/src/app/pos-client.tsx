"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { cn } from "@/lib/cn";
import { type CartItem, type Product } from "@/data/mock";

export type CategoryData = {
  id: string;
  nameKey: string;
  icon: string;
};

export type ProductData = Product;
import { type Locale, localeNames, localeFlags, t, getProductName } from "@/i18n/locales";
import { merchantThemes, applyTheme } from "@/lib/theme";
import CheckoutModal from "@/components/checkout/checkout-modal";
import {
  LayoutGrid, Coffee, Cookie, Snowflake, Milk, Home, Heart, Flame,
  Search, Plus, Minus, Trash2, ShoppingBag, CreditCard,
  User, X, Globe, Check,
  ChevronDown, Palette,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  LayoutGrid, Coffee, Cookie, Snowflake, Milk, Home, Heart, Flame,
};

type Props = {
  initialProducts: ProductData[];
  initialCategories: CategoryData[];
};

export default function POSClient({ initialProducts, initialCategories }: Props) {
  const [locale, setLocale] = useState<Locale>("tc");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [currentTheme, setCurrentTheme] = useState("default");
  const [addedId, setAddedId] = useState<string | null>(null);

  useEffect(() => {
    applyTheme(merchantThemes[currentTheme]);
  }, [currentTheme]);

  const filtered = useMemo(() => {
    let list = initialProducts;
    if (activeCategory === "popular") {
      list = list.filter((p) => p.popular);
    } else if (activeCategory !== "all") {
      list = list.filter((p) => p.category === activeCategory);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.nameCn.includes(q) ||
          (p.nameJa && p.nameJa.includes(q)) ||
          (p.namePt && p.namePt.toLowerCase().includes(q))
      );
    }
    return list;
  }, [initialProducts, activeCategory, search]);

  const addToCart = useCallback((product: Product) => {
    if (!product.inStock) return;
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

  return (
    <div className="h-screen flex overflow-hidden bg-pos-bg">
      {/* ============ LEFT: PRODUCT AREA ============ */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header bar */}
        <header className="h-[60px] flex items-center gap-3 px-5 bg-pos-surface border-b border-pos-border shrink-0">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mr-3">
            <div
              className="h-8 w-8 rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-[11px] text-white"
              style={{ backgroundColor: "var(--color-pos-accent)" }}
            >
              CS
            </div>
            <span className="text-[15px] font-semibold text-pos-text hidden lg:block">
              CountingStars
            </span>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-pos-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder={t(locale, "search")}
              aria-label={t(locale, "search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 text-[14px] bg-pos-bg border border-pos-border rounded-[var(--radius-md)] text-pos-text placeholder:text-pos-text-muted focus:outline-none focus:ring-2 focus:ring-pos-accent/30 focus:border-pos-accent transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-pos-text-muted hover:text-pos-text"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Theme selector */}
            <div className="relative">
              <button
                onClick={() => { setShowThemeMenu(!showThemeMenu); setShowLangMenu(false); }}
                aria-label="Change theme"
                className="h-9 px-2.5 flex items-center gap-1.5 text-[13px] text-pos-text-secondary border border-pos-border rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors"
              >
                <Palette className="h-4 w-4" />
              </button>
              {showThemeMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 bg-pos-surface border border-pos-border rounded-[var(--radius-md)] shadow-lg py-1.5 min-w-[180px] animate-scale-in">
                    {Object.entries(merchantThemes).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => { setCurrentTheme(key); setShowThemeMenu(false); }}
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
                  </div>
                </>
              )}
            </div>

            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => { setShowLangMenu(!showLangMenu); setShowThemeMenu(false); }}
                aria-label={t(locale, "language")}
                className="h-9 px-2.5 flex items-center gap-1.5 text-[13px] text-pos-text-secondary border border-pos-border rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{localeFlags[locale]}</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 bg-pos-surface border border-pos-border rounded-[var(--radius-md)] shadow-lg py-1.5 min-w-[170px] animate-scale-in">
                    {(Object.keys(localeNames) as Locale[]).map((l) => (
                      <button
                        key={l}
                        onClick={() => { setLocale(l); setShowLangMenu(false); }}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-colors",
                          locale === l ? "bg-pos-surface-active text-pos-text" : "text-pos-text-secondary hover:bg-pos-surface-hover"
                        )}
                      >
                        <span>{localeFlags[l]}</span>
                        <span>{localeNames[l]}</span>
                        {locale === l && <Check className="h-3.5 w-3.5 ml-auto text-pos-accent" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Member */}
            <button
              aria-label={t(locale, "member")}
              className="h-9 px-3 flex items-center gap-1.5 text-[13px] text-pos-text-secondary border border-pos-border rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hidden md:inline">{t(locale, "member")}</span>
            </button>
          </div>
        </header>

        {/* Category tabs */}
        <div className="h-[52px] flex items-center gap-1.5 px-5 bg-pos-surface border-b border-pos-border shrink-0 overflow-x-auto hide-scrollbar">
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

        {/* Product count */}
        <div className="px-5 py-3 flex items-center justify-between shrink-0">
          <span className="text-[13px] text-pos-text-secondary">
            {filtered.length} {t(locale, "items")}
          </span>
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
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
                    "relative flex flex-col p-3.5 rounded-[var(--radius-md)] border transition-all text-left group",
                    !product.inStock
                      ? "border-pos-border opacity-40 cursor-not-allowed bg-pos-surface"
                      : inCart
                      ? "border-pos-accent/30 bg-pos-accent-light shadow-sm"
                      : "border-pos-border bg-pos-surface hover:border-pos-border-strong hover:shadow-sm active:scale-[0.97]",
                    justAdded && "scale-[0.97]"
                  )}
                >
                  {/* Image area */}
                  <div className="w-full aspect-[4/3] rounded-[var(--radius-sm)] bg-pos-bg mb-3 flex items-center justify-center overflow-hidden">
                    <ShoppingBag className="h-7 w-7 text-pos-text-muted/40" strokeWidth={1.25} />
                  </div>

                  {/* Name */}
                  <p className="text-[14px] font-medium text-pos-text leading-snug truncate">
                    {displayName}
                  </p>
                  {locale !== "en" && (
                    <p className="text-[11px] text-pos-text-muted truncate mt-0.5">
                      {product.name}
                    </p>
                  )}

                  {/* Price row */}
                  <div className="flex items-center justify-between mt-2.5">
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
        </div>
      </main>

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
            <div className="p-3 space-y-1">
              {cart.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] hover:bg-pos-surface-hover transition-colors group animate-slide-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-pos-text truncate">
                      {getProductName(item, locale)}
                    </p>
                    <p className="text-[12px] text-pos-text-muted mt-0.5">
                      MOP {item.price.toFixed(1)}
                    </p>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-0.5 bg-pos-bg rounded-[var(--radius-sm)] border border-pos-border">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      aria-label={`Decrease ${item.name}`}
                      className="h-8 w-8 flex items-center justify-center text-pos-text-secondary hover:text-pos-text transition-colors rounded-l-[var(--radius-sm)]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-[14px] font-semibold text-pos-text tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label={`Increase ${item.name}`}
                      className="h-8 w-8 flex items-center justify-center text-pos-text-secondary hover:text-pos-text transition-colors rounded-r-[var(--radius-sm)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right min-w-[55px]">
                    <p className="text-[14px] font-semibold text-pos-text tabular-nums">
                      ${(item.price * item.quantity).toFixed(1)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name}`}
                    className="h-7 w-7 flex items-center justify-center text-pos-text-muted hover:text-pos-danger hover:bg-pos-danger-light rounded-[var(--radius-sm)] transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
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
    </div>
  );
}
