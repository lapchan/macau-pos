import { getCurrentCustomer } from "@/lib/actions/auth";
import ProfileForm from "./profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  return (
    <ProfileForm
      locale={locale}
      initialData={{
        name: customer.name,
        email: customer.email || "",
        phone: customer.phone || "",
        locale: customer.locale || "tc",
      }}
    />
  );
}
