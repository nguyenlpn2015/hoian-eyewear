import React from "react";
import { getProducts } from "@/lib/data/catalog";
import { getInventoryBalances } from "@/lib/data/inventory";
import ProductsAdminView from "@/components/admin/ProductsAdminView";

export default async function AdminProductsPage() {
  const [products, balances] = await Promise.all([
    getProducts(),
    getInventoryBalances(),
  ]);

  return <ProductsAdminView products={products} initialBalances={balances} />;
}
