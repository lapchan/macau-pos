"use client";

import { useState } from "react";
import {
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

type Category = {
  id: string;
  slug: string | null;
  name: string;
  translations: Record<string, string> | null;
  icon: string | null;
};

type Props = {
  locale: string;
  tenantName: string;
  tenantLogo?: string | null;
  accentColor: string;
  categories: Category[];
  cartCount?: number;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function StoreHeader({ locale, tenantName, tenantLogo, accentColor, categories, cartCount = 0 }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
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
              <div className="flow-root">
                <a href={`/${locale}/login`} className="-m-2 block p-2 font-medium text-gray-900">
                  {t(locale, "登入", "Sign in", "Entrar", "ログイン")}
                </a>
              </div>
              <div className="flow-root">
                <a href={`/${locale}/register`} className="-m-2 block p-2 font-medium text-gray-900">
                  {t(locale, "建立帳號", "Create an account", "Criar conta", "アカウント作成")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative z-10">
        <nav aria-label="Top">
          {/* Top bar */}
          <div className="bg-gray-900">
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
                    className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-gray-900 py-0.5 pr-7 pl-2 text-left text-sm font-medium text-white focus:outline-none focus:outline-2 focus:outline-offset-2 focus:outline-white"
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

              {/* Sign in / Create account (right) */}
              <div className="flex items-center space-x-6">
                <a href={`/${locale}/login`} className="text-sm font-medium text-white hover:text-gray-100">
                  {t(locale, "登入", "Sign in", "Entrar", "ログイン")}
                </a>
                <a href={`/${locale}/register`} className="text-sm font-medium text-white hover:text-gray-100">
                  {t(locale, "建立帳號", "Create an account", "Criar conta", "アカウント作成")}
                </a>
              </div>
            </div>
          </div>

          {/* Secondary navigation */}
          <div className="bg-gray-900/75 backdrop-blur-md backdrop-saturate-150">
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
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
                          style={{ backgroundColor: accentColor }}
                        >
                          {tenantName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </a>
                  </div>

                  {/* Flyout menus (lg+) */}
                  <div className="hidden h-full lg:flex">
                    <div className="inset-x-0 bottom-0 px-4">
                      <div className="flex h-full justify-center space-x-8">
                        {categories.slice(0, 6).map((cat) => {
                          const name = (cat.translations as Record<string, string>)?.[locale] || cat.name;
                          return (
                            <a
                              key={cat.id}
                              href={cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`}
                              className="flex items-center text-sm font-medium text-white"
                            >
                              {name}
                            </a>
                          );
                        })}
                        <a href={`/${locale}/products`} className="flex items-center text-sm font-medium text-white">
                          {t(locale, "全部商品", "All Products", "Produtos", "全商品")}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Mobile menu + search (lg-) */}
                  <div className="flex flex-1 items-center lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileMenuOpen(true)}
                      className="-ml-2 p-2 text-white"
                    >
                      <span className="sr-only">Open menu</span>
                      <Bars3Icon className="size-6" aria-hidden="true" />
                    </button>

                    <a href={`/${locale}/products`} className="ml-2 p-2 text-white">
                      <span className="sr-only">Search</span>
                      <MagnifyingGlassIcon className="size-6" aria-hidden="true" />
                    </a>
                  </div>

                  {/* Logo (lg-) */}
                  <a href={`/${locale}`} className="lg:hidden">
                    <span className="sr-only">{tenantName}</span>
                    {tenantLogo ? (
                      <img src={tenantLogo} alt="" className="h-8 w-auto" />
                    ) : (
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
                        style={{ backgroundColor: accentColor }}
                      >
                        {tenantName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </a>

                  {/* Right icons */}
                  <div className="flex flex-1 items-center justify-end">
                    <a href={`/${locale}/products`} className="hidden text-sm font-medium text-white lg:block">
                      {t(locale, "搜尋", "Search", "Pesquisar", "検索")}
                    </a>

                    <div className="flex items-center lg:ml-8">
                      {/* Help */}
                      <a href={`/${locale}/pages/help`} className="hidden p-2 text-white lg:block">
                        <span className="sr-only">Help</span>
                        <QuestionMarkCircleIcon className="size-6" aria-hidden="true" />
                      </a>
                      <a href={`/${locale}/pages/help`} className="hidden text-sm font-medium text-white lg:block">
                        {t(locale, "幫助", "Help", "Ajuda", "ヘルプ")}
                      </a>

                      {/* Cart */}
                      <div className="ml-4 flow-root lg:ml-8">
                        <a href={`/${locale}/cart`} className="group -m-2 flex items-center p-2">
                          <ShoppingBagIcon className="size-6 shrink-0 text-white" aria-hidden="true" />
                          <span className="ml-2 text-sm font-medium text-white">{cartCount}</span>
                          <span className="sr-only">
                            {t(locale, "購物車", "items in cart, view bag", "itens no carrinho", "カート内のアイテム")}
                          </span>
                        </a>
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
