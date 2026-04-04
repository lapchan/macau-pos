import { getStrategies } from "@/lib/pricing-strategy-queries";
import StrategiesClient from "./strategies-client";

export const metadata = { title: "Pricing Strategies" };

export default async function PricingStrategiesPage() {
  const strategies = await getStrategies();
  return <StrategiesClient strategies={strategies} />;
}
