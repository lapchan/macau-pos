import { notFound } from "next/navigation";
import { getStrategyById, getStrategyItems, getProductsNotInStrategy } from "@/lib/pricing-strategy-queries";
import StrategyDetailClient from "./strategy-detail-client";

export const metadata = { title: "Strategy Details" };

export default async function StrategyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const strategy = await getStrategyById(id);
  if (!strategy) notFound();

  const items = await getStrategyItems(id);
  const availableProducts = await getProductsNotInStrategy(id);

  return (
    <StrategyDetailClient
      strategy={strategy}
      items={items}
      availableProducts={availableProducts}
    />
  );
}
