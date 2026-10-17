import React from "react";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/data/catalog";
import { getInventoryBalances } from "@/lib/data/inventory";
import ProductDetailClientView from "@/components/product/ProductDetailClientView";

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sku?: string }>;
}) {
  const { slug } = await params;
  const { sku } = await searchParams;

  const [product, inventory] = await Promise.all([
    getProductBySlug(slug),
    getInventoryBalances(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClientView
      product={product}
      initialSku={sku}
      inventoryBalances={inventory}
    />
  );
}
