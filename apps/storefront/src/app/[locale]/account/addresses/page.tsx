import { getAddresses } from "@/lib/actions/account";
import AddressesClient from "./addresses-client";

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const addresses = await getAddresses();

  return <AddressesClient locale={locale} initialAddresses={addresses} />;
}
