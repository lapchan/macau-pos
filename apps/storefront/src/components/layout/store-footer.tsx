type Props = {
  locale: string;
  tenantName: string;
  categories: { id: string; slug: string | null; name: string; translations: Record<string, string> | null }[];
};

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default function StoreFooter({ locale, tenantName, categories }: Props) {
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
                  className="flex w-full items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
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
