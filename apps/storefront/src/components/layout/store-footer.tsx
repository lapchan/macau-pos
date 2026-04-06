type Props = {
  locale: string;
  tenantName: string;
  categories: { id: string; slug: string | null; name: string; translations: Record<string, string> | null }[];
  accentColor?: string;
  themeId?: string;
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function StoreFooter({ locale, tenantName, categories, accentColor = "#4f46e5", themeId }: Props) {
  const footerNav = {
    shop: categories.slice(0, 5).map((cat) => ({
      name: (cat.translations as Record<string, string>)?.[locale] || cat.name,
      href: cat.slug ? `/${locale}/categories/${cat.slug}` : `/${locale}/products`,
    })),
    company: [
      { name: t(locale, "關於我們", "About us", "Sobre nós", "私たちについて"), href: `/${locale}/pages/about` },
      { name: t(locale, "門店", "Stores", "Lojas", "店舗"), href: `/${locale}/pages/stores` },
      { name: t(locale, "條款及細則", "Terms & Conditions", "Termos e Condições", "利用規約"), href: `/${locale}/pages/terms` },
      { name: t(locale, "私隱政策", "Privacy Policy", "Política de Privacidade", "プライバシーポリシー"), href: `/${locale}/pages/privacy` },
    ],
    account: [
      { name: t(locale, "管理帳號", "Manage Account", "Gerir Conta", "アカウント管理"), href: `/${locale}/account` },
      { name: t(locale, "退換貨", "Returns & Exchanges", "Devoluções", "返品・交換"), href: `/${locale}/pages/returns` },
    ],
    connect: [
      { name: t(locale, "聯絡我們", "Contact Us", "Contacte-nos", "お問い合わせ"), href: `/${locale}/pages/contact` },
      { name: "Facebook", href: "#" },
      { name: "Instagram", href: "#" },
      { name: "WhatsApp", href: "#" },
    ],
  };

  /* ─── HUMAN MADE footer ───
     From HTML: footer.mt-6.mt-md-8.border-light.border-top.text-tertiary.fs-xs.lh-sm.ls-05
     - 4 columns of category links (ALL ITEMS, NEW ARRIVALS, OUTERWEAR, etc.)
     - Centered logo-footer.svg
     - Social icons: Instagram, RED, WeChat, Weibo
     - text-tertiary = muted color, fs-xs = 12px, ls-05 = letter-spacing 0.05em
  */
  if (themeId === "humanmade") {
    const col1 = [
      { name: "ALL ITEMS", href: `/${locale}/products` },
      { name: "NEW ARRIVALS", href: `/${locale}/products?sort=newest` },
      { name: "OUTERWEAR", href: `/${locale}/categories/outerwear` },
      { name: "SHIRTS", href: `/${locale}/categories/shirts` },
      { name: "T-SHIRTS", href: `/${locale}/categories/t-shirts` },
      { name: "SWEATSHIRTS", href: `/${locale}/categories/sweatshirts` },
    ];
    const col2 = [
      { name: "PANTS", href: `/${locale}/categories/pants` },
      { name: "BAGS", href: `/${locale}/categories/bags` },
      { name: "ACCESSORIES", href: `/${locale}/categories/accessories` },
      { name: "HOME", href: `/${locale}/categories/home-goods` },
    ];
    const col3 = [
      { name: t(locale, "關於我們", "ABOUT", "SOBRE", "ブランドについて"), href: `/${locale}/pages/about` },
      { name: t(locale, "門店", "STORES", "LOJAS", "店舗"), href: `/${locale}/pages/stores` },
      { name: t(locale, "常見問題", "FAQ", "FAQ", "よくあるご質問"), href: `/${locale}/pages/faq` },
      { name: t(locale, "聯絡我們", "CONTACT", "CONTACTO", "お問い合わせ"), href: `/${locale}/pages/contact` },
    ];
    const col4 = [
      { name: t(locale, "配送與運費", "SHIPPING", "ENVIO", "配送について"), href: `/${locale}/pages/shipping` },
      { name: t(locale, "退換貨", "RETURNS", "DEVOLUÇÕES", "返品"), href: `/${locale}/pages/returns` },
      { name: t(locale, "服務條款", "TERMS", "TERMOS", "利用規約"), href: `/${locale}/pages/terms` },
      { name: t(locale, "私隱政策", "PRIVACY", "PRIVACIDADE", "プライバシー"), href: `/${locale}/pages/privacy` },
    ];

    return (
      <footer className="mt-10 md:mt-14 border-t border-[#121212]/8 bg-white text-[#121212]/60" style={{ fontSize: "12px", letterSpacing: "0.05em", lineHeight: "1.2" }}>
        <div className="py-8 md:py-12">
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
            {/* Link columns */}
            <div className="flex flex-col md:flex-row gap-6 md:gap-0 md:justify-between px-2 md:px-12 lg:px-10">
              {[col1, col2, col3, col4].map((col, ci) => (
                <ul key={ci} role="list" className="flex flex-col gap-3 list-none m-0 p-0" style={{ minWidth: "200px" }}>
                  {col.map((item) => (
                    <li key={item.name}>
                      <a href={item.href} className="text-[#121212]/60 hover:text-[#121212] transition-colors">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ))}
            </div>

            {/* Centered logo + social */}
            <div className="mt-10 flex flex-col items-center gap-4">
              {/* Logo */}
              <a href={`/${locale}`}>
                <svg width="36" height="40" viewBox="0 0 48 52" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="20" y1="2" x2="20" y2="10" stroke="#E53935" strokeWidth="2"/>
                  <line x1="24" y1="0" x2="24" y2="10" stroke="#E53935" strokeWidth="2"/>
                  <line x1="28" y1="2" x2="28" y2="10" stroke="#E53935" strokeWidth="2"/>
                  <path d="M24 48C24 48 4 34 4 20C4 14 8 10 14 10C18 10 22 13 24 16C26 13 30 10 34 10C40 10 44 14 44 20C44 34 24 48 24 48Z" fill="#E53935"/>
                  <text x="24" y="28" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">HUMAN</text>
                  <text x="24" y="35" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="Arial, sans-serif">MADE</text>
                </svg>
              </a>

              {/* Social icons */}
              <div className="flex gap-2 text-[#121212]">
                <a href="#" aria-label="Instagram" className="transition-transform hover:scale-105">
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  /* ─── Default footer ─── */
  return (
    <footer aria-labelledby="footer-heading" className="bg-gray-900">
      <h2 id="footer-heading" className="sr-only">Footer</h2>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-20 xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Links */}
          <div className="grid grid-cols-2 gap-8 xl:col-span-2">
            <div className="space-y-12 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
              <div>
                <h3 className="text-sm font-medium text-white">
                  {t(locale, "商品", "Shop", "Loja", "ショップ")}
                </h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNav.shop.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-300 hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  {t(locale, "公司", "Company", "Empresa", "会社")}
                </h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNav.company.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-300 hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="space-y-12 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
              <div>
                <h3 className="text-sm font-medium text-white">
                  {t(locale, "帳號", "Account", "Conta", "アカウント")}
                </h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNav.account.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-300 hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-white">
                  {t(locale, "聯繫", "Connect", "Conectar", "コネクト")}
                </h3>
                <ul role="list" className="mt-6 space-y-6">
                  {footerNav.connect.map((item) => (
                    <li key={item.name} className="text-sm">
                      <a href={item.href} className="text-gray-300 hover:text-white">
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="mt-12 xl:mt-0">
            <h3 className="text-sm font-medium text-white">
              {t(locale, "訂閱電子報", "Sign up for our newsletter", "Assine a nossa newsletter", "ニュースレター登録")}
            </h3>
            <p className="mt-6 text-sm text-gray-300">
              {t(locale, "最新優惠，每週送到您的收件箱。", "The latest deals and savings, sent to your inbox weekly.", "As últimas ofertas, enviadas semanalmente.", "最新情報を毎週お届けします。")}
            </p>
            <form className="mt-4 flex max-w-md">
              <input
                id="email-address"
                type="email"
                required
                autoComplete="email"
                aria-label="Email address"
                placeholder={t(locale, "電子郵件地址", "Email address", "Endereço de e-mail", "メールアドレス")}
                className="block w-full rounded-md bg-white px-4 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-white"
              />
              <div className="ml-4 shrink-0">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm hover:opacity-85 focus:outline-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                  style={{ backgroundColor: accentColor }}
                >
                  {t(locale, "訂閱", "Sign up", "Assinar", "登録")}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 py-10">
          <p className="text-sm text-gray-400">
            Copyright &copy; {new Date().getFullYear()} {tenantName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
