"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import CartPopover from "@/components/cart/cart-popover";

type Category = {
  id: string;
  slug: string | null;
  name: string;
  translations: Record<string, string> | null;
  icon: string | null;
};

type CartItem = {
  id: string;
  name: string;
  variant?: string;
  price: number;
  quantity: number;
  image?: string | null;
  slug?: string | null;
};

type NavLink = {
  label: string;
  href: string;
};

type Props = {
  locale: string;
  tenantName: string;
  tenantLogo?: string | null;
  accentColor: string;
  headerStyle?: "dark" | "light";
  themeId?: string;
  categories: Category[];
  customNavLinks?: NavLink[];
  cartCount?: number;
  cartItems?: CartItem[];
  customer?: { name: string } | null;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function StoreHeader({ locale, tenantName, tenantLogo, accentColor, headerStyle = "dark", themeId, categories, customNavLinks = [], cartCount = 0, cartItems = [], customer = null }: Props) {
  const isDark = headerStyle === "dark";
  const hasCustomNav = customNavLinks.length > 0;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isCheckoutPage = /\/(checkout|cart)(\/|$)/.test(pathname || "");

  // Focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Keyboard shortcut: Cmd/Ctrl+K to open search
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    router.push(`/${locale}/products?q=${encodeURIComponent(q)}`);
  }

  // ---------- HUMAN MADE variant ----------
  // Design system from humanmade.jp:
  // Font: avenir-next-lt-pro, sans-serif
  // Body color: #121212, bg: #fff
  // Letter-spacing: 0.06rem body, nav ls-05 = 0.05em
  // Nav: SHOP / NEWS / ABOUT — fs-xs (12px), text-secondary, w-180px each, centered
  // Product hover: scale(1.03), swatches h-8px w-35px
  // Header: bg-primary (white), navbar-header h-6 (48px)
  if (themeId === "humanmade") {
    const hmNavLinks = hasCustomNav
      ? customNavLinks
      : [
          { label: "SHOP", href: `/${locale}/products` },
          { label: "NEWS", href: `/${locale}/pages/news` },
          { label: "ABOUT", href: `/${locale}/pages/about` },
        ];

    // Build mega menu columns from categories (3 columns, ~7 items each)
    const megaMenuItems: { label: string; href: string }[] = [
      { label: t(locale, "ALL ITEMS", "ALL ITEMS", "ALL ITEMS", "ALL ITEMS"), href: `/${locale}/products` },
      ...categories.map((cat) => {
        const name = (cat.translations as Record<string, string>)?.[locale] || cat.name;
        return {
          label: name.toUpperCase(),
          href: cat.slug ? `/${locale}/products?category=${cat.slug}` : `/${locale}/products`,
        };
      }),
    ];
    const colSize = Math.ceil(megaMenuItems.length / 3);
    const megaCols = [
      megaMenuItems.slice(0, colSize),
      megaMenuItems.slice(colSize, colSize * 2),
      megaMenuItems.slice(colSize * 2),
    ];

    return (
      <HumanMadeHeader
        locale={locale}
        tenantName={tenantName}
        tenantLogo={tenantLogo}
        hmNavLinks={hmNavLinks}
        megaCols={megaCols}
        cartCount={cartCount}
        cartItems={cartItems}
        customer={customer}
        searchOpen={searchOpen}
        setSearchOpen={setSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        handleSearch={handleSearch}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        categories={categories}
        minimal={isCheckoutPage}
      />
    );
  }

  // ---------- Default header variants (dark / light) ----------
  return (
    <>
      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSearchOpen(false)} />
          <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-xl px-4 pt-20 sm:pt-24">
            <form onSubmit={handleSearch} className="relative rounded-xl bg-white shadow-2xl ring-1 ring-gray-200">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 size-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(locale, "搜尋商品…", "Search products…", "Pesquisar produtos…", "商品を検索…")}
                className="w-full rounded-xl border-0 bg-transparent py-3.5 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm"
              />
              <div className="absolute right-3 top-3">
                <kbd className="rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-400">
                  ESC
                </kbd>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/25 animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-full max-w-sm flex-col overflow-y-auto bg-white pb-12 shadow-xl animate-sheet-up">
            {/* Close button */}
            <div className="flex px-4 pt-5 pb-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="relative -m-2 inline-flex items-center justify-center rounded-md p-2 text-gray-400"
              >
                <span className="sr-only">Close menu</span>
                <XMarkIcon className="size-6" aria-hidden="true" />
              </button>
            </div>

            {/* Category links */}
            <div className="mt-2 space-y-6 border-t border-gray-200 px-4 py-6">
              <a
                href={`/${locale}/products`}
                className="-m-2 block p-2 font-medium text-gray-900"
              >
                {t(locale, "全部商品", "All Products", "Todos os Produtos", "全商品")}
              </a>
              {categories.map((cat) => {
                const name = (cat.translations as Record<string, string>)?.[locale] || cat.name;
                return (
                  <a
                    key={cat.id}
                    href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                    className="-m-2 block p-2 font-medium text-gray-900"
                  >
                    {name}
                  </a>
                );
              })}
            </div>

            {/* Account links */}
            <div className="space-y-6 border-t border-gray-200 px-4 py-6">
              {customer ? (
                <>
                  <div className="flow-root">
                    <a href={`/${locale}/account/profile`} className="-m-2 block p-2 font-medium text-gray-900">
                      {customer.name}
                    </a>
                  </div>
                  <div className="flow-root">
                    <a href={`/${locale}/account/orders`} className="-m-2 block p-2 font-medium text-gray-900">
                      {t(locale, "我的訂單", "My Orders", "Meus Pedidos", "注文履歴")}
                    </a>
                  </div>
                  <div className="flow-root">
                    <a href={`/${locale}/account/addresses`} className="-m-2 block p-2 font-medium text-gray-900">
                      {t(locale, "送貨地址", "Addresses", "Endereços", "配送先")}
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <div className="flow-root">
                    <a href={`/${locale}/login`} className="-m-2 block p-2 font-medium text-gray-900">
                      {t(locale, "登入", "Sign in", "Entrar", "ログイン")}
                    </a>
                  </div>
                  <div className="flow-root">
                    <a href={`/${locale}/login`} className="-m-2 block p-2 font-medium text-gray-900">
                      {t(locale, "建立帳號", "Create an account", "Criar conta", "アカウント作成")}
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10">
        <nav aria-label="Top">
          {/* Top bar */}
          <div className={isDark ? "bg-gray-900" : "bg-gray-100"}>
            <div className="mx-auto flex h-10 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
              {/* Language selector (left) */}
              <form>
                <div className="relative inline-grid grid-cols-1">
                  <select
                    aria-label="Language"
                    defaultValue={locale}
                    onChange={(e) => {
                      const newLocale = e.target.value;
                      const path = window.location.pathname.replace(/^\/(tc|sc|en|pt|ja)/, `/${newLocale}`);
                      window.location.href = path;
                    }}
                    className={`col-start-1 row-start-1 w-full appearance-none rounded-md py-0.5 pr-7 pl-2 text-left text-sm font-medium focus:outline-none focus:outline-2 focus:outline-offset-2 ${isDark ? "bg-gray-900 text-white focus:outline-white" : "bg-gray-100 text-gray-900 focus:outline-gray-400"}`}
                  >
                    <option value="tc">繁中</option>
                    <option value="sc">简中</option>
                    <option value="en">English</option>
                    <option value="pt">Português</option>
                    <option value="ja">日本語</option>
                  </select>
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 mr-1 size-5 self-center justify-self-end fill-gray-300">
                    <path d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" fillRule="evenodd" />
                  </svg>
                </div>
              </form>

              {/* Auth links (right) */}
              <div className="flex items-center space-x-6">
                {customer ? (
                  <>
                    <a href={`/${locale}/account`} className={`text-sm font-medium ${isDark ? "text-white hover:text-gray-100" : "text-gray-700 hover:text-gray-900"}`}>
                      {customer.name}
                    </a>
                    <a href={`/${locale}/account/orders`} className={`text-sm font-medium ${isDark ? "text-white hover:text-gray-100" : "text-gray-700 hover:text-gray-900"}`}>
                      {t(locale, "我的訂單", "My Orders", "Meus Pedidos", "注文履歴")}
                    </a>
                  </>
                ) : (
                  <>
                    <a href={`/${locale}/login`} className={`text-sm font-medium ${isDark ? "text-white hover:text-gray-100" : "text-gray-700 hover:text-gray-900"}`}>
                      {t(locale, "登入", "Sign in", "Entrar", "ログイン")}
                    </a>
                    <a href={`/${locale}/login`} className={`text-sm font-medium ${isDark ? "text-white hover:text-gray-100" : "text-gray-700 hover:text-gray-900"}`}>
                      {t(locale, "建立帳號", "Create an account", "Criar conta", "アカウント作成")}
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Secondary navigation */}
          <div className={isDark ? "bg-gray-900/75 backdrop-blur-md backdrop-saturate-150" : "bg-white border-b border-gray-200"}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div>
                <div className="flex h-16 items-center justify-between">
                  {/* Logo (lg+) */}
                  <div className="hidden lg:flex lg:flex-1 lg:items-center">
                    <a href={`/${locale}`}>
                      <span className="sr-only">{tenantName}</span>
                      {tenantLogo ? (
                        <img src={tenantLogo} alt="" className="h-8 w-auto" />
                      ) : (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${isDark ? "text-white" : "text-white"}`}
                          style={{ backgroundColor: accentColor }}
                        >
                          {tenantName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </a>
                  </div>

                  {/* Nav links (lg+) */}
                  {!isCheckoutPage && (
                  <div className="hidden h-full lg:flex">
                    <div className="inset-x-0 bottom-0 px-4">
                      <div className="flex h-full justify-center space-x-8">
                        {hasCustomNav ? (
                          customNavLinks.map((link, i) => (
                            <a
                              key={i}
                              href={link.href}
                              className={`flex items-center text-sm font-medium ${isDark ? "text-white" : "text-gray-700"}`}
                            >
                              {link.label}
                            </a>
                          ))
                        ) : (
                          <>
                            {categories.slice(0, 6).map((cat) => {
                              const name = (cat.translations as Record<string, string>)?.[locale] || cat.name;
                              return (
                                <a
                                  key={cat.id}
                                  href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                                  className={`flex items-center text-sm font-medium ${isDark ? "text-white" : "text-gray-700"}`}
                                >
                                  {name}
                                </a>
                              );
                            })}
                            <a href={`/${locale}/products`} className={`flex items-center text-sm font-medium ${isDark ? "text-white" : "text-gray-700"}`}>
                              {t(locale, "全部商品", "All Products", "Produtos", "全商品")}
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Mobile menu + search (lg-) */}
                  <div className="flex flex-1 items-center lg:hidden">
                    {!isCheckoutPage && (
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(true)}
                      className={`-ml-2 p-2 ${isDark ? "text-white" : "text-gray-700"}`}
                    >
                      <span className="sr-only">Open menu</span>
                      <Bars3Icon className="size-6" aria-hidden="true" />
                    </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className={`ml-2 p-2 ${isDark ? "text-white" : "text-gray-700"}`}
                    >
                      <span className="sr-only">Search</span>
                      <MagnifyingGlassIcon className="size-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Logo (lg-) */}
                  <a href={`/${locale}`} className="lg:hidden">
                    <span className="sr-only">{tenantName}</span>
                    {tenantLogo ? (
                      <img src={tenantLogo} alt="" className="h-8 w-auto" />
                    ) : (
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm ${isDark ? "text-white" : "text-white"}`}
                        style={{ backgroundColor: accentColor }}
                      >
                        {tenantName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </a>

                  {/* Right icons */}
                  <div className="flex flex-1 items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setSearchOpen(true)}
                      className={`hidden text-sm font-medium lg:block ${isDark ? "text-white" : "text-gray-700"}`}
                    >
                      {t(locale, "搜尋", "Search", "Pesquisar", "検索")}
                    </button>

                    <div className="flex items-center lg:ml-8">
                      {/* Help */}
                      <a href={`/${locale}/pages/help`} className={`hidden p-2 lg:block ${isDark ? "text-white" : "text-gray-700"}`}>
                        <span className="sr-only">Help</span>
                        <QuestionMarkCircleIcon className="size-6" aria-hidden="true" />
                      </a>
                      <a href={`/${locale}/pages/help`} className={`hidden text-sm font-medium lg:block ${isDark ? "text-white" : "text-gray-700"}`}>
                        {t(locale, "幫助", "Help", "Ajuda", "ヘルプ")}
                      </a>

                      {/* Cart popover */}
                      <div className="ml-4 flow-root lg:ml-8">
                        <CartPopover
                          items={cartItems}
                          itemCount={cartCount}
                          locale={locale}
                          isDark={isDark}
                          themeId={themeId}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}

// ── HUMAN MADE Header (extracted for state management with mega menu) ──
function HumanMadeHeader({
  locale,
  tenantName,
  tenantLogo,
  hmNavLinks,
  megaCols,
  cartCount,
  cartItems,
  customer,
  searchOpen,
  setSearchOpen,
  searchQuery,
  setSearchQuery,
  searchInputRef,
  handleSearch,
  mobileMenuOpen,
  setMobileMenuOpen,
  categories,
  minimal = false,
}: {
  locale: string;
  tenantName: string;
  tenantLogo?: string | null;
  hmNavLinks: NavLink[];
  megaCols: { label: string; href: string }[][];
  cartCount: number;
  cartItems: CartItem[];
  customer?: { name: string } | null;
  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  handleSearch: (e: React.FormEvent) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  categories: Category[];
  minimal?: boolean;
}) {
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const shopMenuTimeout = useRef<NodeJS.Timeout | null>(null);

  const openShopMenu = () => {
    if (shopMenuTimeout.current) clearTimeout(shopMenuTimeout.current);
    setShopMenuOpen(true);
  };
  const closeShopMenu = () => {
    shopMenuTimeout.current = setTimeout(() => setShopMenuOpen(false), 150);
  };

  return (
    <>
      {/* Search modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/55" onClick={() => setSearchOpen(false)} />
          <div className="fixed inset-x-0 top-0 z-50 mx-auto max-w-xl px-4 pt-20 sm:pt-24">
            <form onSubmit={handleSearch} className="relative bg-white shadow-2xl">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-3.5 size-5 text-[#121212]/40" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(locale, "搜尋商品…", "Search products…", "Pesquisar produtos…", "商品を検索…")}
                className="w-full border-0 bg-transparent py-3.5 pl-12 pr-4 text-[#121212] placeholder:text-[#121212]/40 focus:ring-0 text-xs"
                style={{ letterSpacing: "0.06rem" }}
              />
              <div className="absolute right-3 top-3">
                <kbd className="border border-[#121212]/10 bg-[#f6f6f6] px-2 py-0.5 text-[10px] text-[#121212]/40">ESC</kbd>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile menu — offcanvas style */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/55" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white overflow-y-auto">
            <div className="flex justify-end px-4 pt-4">
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 text-[#121212]">
                <XMarkIcon className="size-5" />
              </button>
            </div>
            <nav className="mt-6 px-8">
              {/* SHOP section with categories */}
              <div className="mb-8">
                <p className="text-xs text-[#121212] mb-5" style={{ letterSpacing: "0.05em", textDecoration: "underline", textUnderlineOffset: "4px" }}>SHOP</p>
                <div className="flex flex-col gap-4 pl-0">
                  <a href={`/${locale}/products`} className="text-xs text-[#121212]/70 hover:text-[#121212] transition-colors" style={{ letterSpacing: "0.05em" }}>
                    ALL ITEMS
                  </a>
                  {categories.map((cat) => {
                    const name = (cat.translations as Record<string, string>)?.[locale] || cat.name;
                    return (
                      <a
                        key={cat.id}
                        href={cat.slug ? `/${locale}/products?category=${cat.slug}` : `/${locale}/products`}
                        className="text-xs text-[#121212]/70 hover:text-[#121212] transition-colors"
                        style={{ letterSpacing: "0.05em" }}
                      >
                        {name.toUpperCase()}
                      </a>
                    );
                  })}
                </div>
              </div>
              {/* Other nav links */}
              {hmNavLinks.filter(l => l.label !== "SHOP").map((link, i) => (
                <a key={i} href={link.href} className="block mb-5 text-xs text-[#121212] hover:opacity-60 transition-opacity" style={{ letterSpacing: "0.05em" }}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Header */}
      <header className={`relative z-10 bg-white ${minimal ? "border-b border-[#121212]/20" : ""}`}>
        {/* Top icon bar — h-6 (48px) */}
        <div className="flex h-12 items-center justify-between px-2 sm:px-3 lg:px-4">
          {/* Left: locale dropdown + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            {/* Hamburger — mobile */}
            {!minimal && (
              <button type="button" onClick={() => setMobileMenuOpen(true)} className="p-1 text-[#121212] md:hidden">
                <Bars3Icon className="size-5" />
              </button>
            )}

            {/* Locale dropdown */}
            <div className="relative inline-grid grid-cols-1">
              <select
                aria-label="Language"
                defaultValue={locale}
                onChange={(e) => {
                  const newLocale = e.target.value;
                  const path = window.location.pathname.replace(/^\/(tc|sc|en|pt|ja)/, `/${newLocale}`);
                  window.location.href = path;
                }}
                className="col-start-1 row-start-1 w-full appearance-none bg-transparent py-0.5 pr-5 pl-1 text-left text-[#121212] focus:outline-none"
                style={{ fontSize: "12px", letterSpacing: "0.05em" }}
              >
                <option value="tc">繁體中文</option>
                <option value="sc">简体中文</option>
                <option value="en">English</option>
                <option value="pt">Português</option>
                <option value="ja">日本語</option>
              </select>
              <svg viewBox="0 0 20 20" fill="currentColor" className="pointer-events-none col-start-1 row-start-1 mr-0 size-3 self-center justify-self-end fill-[#121212]">
                <path d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" fillRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Right: user + search + cart + hamburger */}
          <div className="flex items-center gap-3">
            <a href={customer ? `/${locale}/account` : `/${locale}/login`} className="hidden p-1 text-[#121212] md:block">
              <UserIcon className="size-5" />
            </a>
            <button type="button" onClick={() => setSearchOpen(true)} className="p-1 text-[#121212]">
              <MagnifyingGlassIcon className="size-5" />
            </button>
            <CartPopover
              items={cartItems}
              itemCount={cartCount}
              locale={locale}
              themeId="humanmade"
            />
            {/* Hamburger — desktop (HUMAN MADE has it on both) */}
            {!minimal && (
              <button type="button" onClick={() => setMobileMenuOpen(true)} className="hidden p-1 text-[#121212] md:block">
                <Bars3Icon className="size-5" />
              </button>
            )}
          </div>
        </div>

        {/* Center: logo */}
        <div className={`flex items-center justify-center pt-2 md:pt-4 ${minimal ? "pb-2 md:pb-2" : "pb-3 md:pb-4"}`}>
          <a href={`/${locale}`} className="block transition-transform duration-300 hover:scale-105">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="h-12 w-auto md:h-16" />
            ) : (
              <svg width="48" height="52" viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="md:w-14 md:h-[60px]">
                <line x1="20" y1="2" x2="20" y2="10" stroke="#E53935" strokeWidth="2"/>
                <line x1="24" y1="0" x2="24" y2="10" stroke="#E53935" strokeWidth="2"/>
                <line x1="28" y1="2" x2="28" y2="10" stroke="#E53935" strokeWidth="2"/>
                <path d="M24 48C24 48 4 34 4 20C4 14 8 10 14 10C18 10 22 13 24 16C26 13 30 10 34 10C40 10 44 14 44 20C44 34 24 48 24 48Z" fill="#E53935"/>
                <text x="24" y="28" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">HUMAN</text>
                <text x="24" y="35" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">MADE</text>
              </svg>
            )}
          </a>
        </div>

        {/* Nav — SHOP / NEWS / ABOUT — centered, fs-xs, 180px each, hidden on mobile */}
        {!minimal && (
        <nav className="hidden pb-3 md:block" aria-label="Main navigation">
          <ul className="flex items-center justify-center m-0 p-0 list-none">
            {hmNavLinks.map((link, i) => {
              const isShop = link.label === "SHOP";
              return (
                <li
                  key={i}
                  className="relative w-[180px] pb-2 text-center"
                  onMouseEnter={isShop ? openShopMenu : undefined}
                  onMouseLeave={isShop ? closeShopMenu : undefined}
                >
                  <a
                    href={link.href}
                    className={`text-[#121212]/60 hover:text-[#121212] transition-colors ${shopMenuOpen && isShop ? "text-[#121212]" : ""}`}
                    style={{
                      fontSize: "12px",
                      letterSpacing: "0.05em",
                      textDecoration: shopMenuOpen && isShop ? "underline" : "none",
                      textUnderlineOffset: "4px",
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        )}

        {/* Mega menu dropdown */}
        {shopMenuOpen && (
          <div
            className="absolute left-0 right-0 z-20 hidden md:block"
            onMouseEnter={openShopMenu}
            onMouseLeave={closeShopMenu}
          >
            {/* Subtle top border */}
            <div className="border-t border-[#e5e5e5]" />
            <div className="bg-white shadow-sm pb-12 pt-8">
              <div className="mx-auto max-w-4xl px-8">
                <div className="grid grid-cols-3 gap-x-16">
                  {megaCols.map((col, colIdx) => (
                    <div key={colIdx} className="flex flex-col gap-5">
                      {col.map((item, itemIdx) => (
                        <a
                          key={itemIdx}
                          href={item.href}
                          className="text-[#121212]/70 hover:text-[#121212] transition-colors"
                          style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.8" }}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay behind mega menu */}
      {shopMenuOpen && (
        <div
          className="fixed inset-0 z-[9] bg-black/20 hidden md:block"
          onMouseEnter={closeShopMenu}
        />
      )}
    </>
  );
}
