import React from "react";
import { getProducts } from "@/lib/data/catalog";
import { getInventoryBalances } from "@/lib/data/inventory";
import { getCurrentStaff } from "@/app/admin/actions";
import POSClientView from "@/components/admin/POSClientView";

export default async function AdminPOSPage() {
  const [products, balances, staff] = await Promise.all([
    getProducts(),
    getInventoryBalances(),
    getCurrentStaff(),
  ]);

  return (
    <POSClientView
      products={products}
      initialBalances={balances}
      staffName={staff?.fullName}
      staffRole={staff?.role}
    />
  );
}
