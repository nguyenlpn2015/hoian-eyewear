import React from "react";
import { getProducts } from "@/lib/data/catalog";
import { getInventoryBalances } from "@/lib/data/inventory";
import { getCurrentStaff } from "@/app/admin/actions";
import InventoryAdminView from "@/components/admin/InventoryAdminView";

export default async function AdminInventoryPage() {
  const [products, balances, staff] = await Promise.all([
    getProducts(),
    getInventoryBalances(),
    getCurrentStaff(),
  ]);

  return (
    <InventoryAdminView
      products={products}
      initialBalances={balances}
      staffRole={staff?.role}
    />
  );
}
