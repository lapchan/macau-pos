import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/actions/auth";
import AccountNav from "./account-nav";

const t = (locale: string, tc: string, en: string, pt: string, ja: string) => {
  const m: Record<string, string> = { tc, sc: tc, en, pt, ja };
  return m[locale] || en;
};

export default async function AccountLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) redirect(`/${locale}/login`);

  const navItems = [
    {
      href: `/${locale}/account/profile`,
      label: t(locale, "個人資料", "Profile", "Perfil", "プロフィール"),
      iconName: "user" as const,
    },
    {
      href: `/${locale}/account/orders`,
      label: t(locale, "我的訂單", "My Orders", "Meus Pedidos", "注文履歴"),
      iconName: "orders" as const,
    },
    {
      href: `/${locale}/account/addresses`,
      label: t(locale, "送貨地址", "Addresses", "Endereços", "配送先"),
      iconName: "address" as const,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
        {/* Sidebar nav */}
        <aside className="lg:col-span-3">
          <div className="mb-6 lg:mb-0">
            <p className="text-sm text-gray-500">
              {t(locale, "歡迎回來", "Welcome back", "Bem-vindo", "おかえりなさい")}
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {customer.name}
            </p>
          </div>
          <AccountNav items={navItems} />
        </aside>

        {/* Main content */}
        <main className="mt-8 lg:col-span-9 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
