import { redirect } from "next/navigation";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Account dashboard — redirect to orders for now
  redirect(`/${locale}/account/orders`);
}
