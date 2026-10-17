import React from "react";
import { getProducts } from "@/lib/data/catalog";
import { getInventoryBalances } from "@/lib/data/inventory";
import { listAdminOrders } from "@/lib/data/orders";
import { getCurrentStaff } from "@/app/admin/actions";
import DashboardAdminView from "@/components/admin/DashboardAdminView";

export default async function AdminDashboardPage() {
  const [products, balances, orders, staff] = await Promise.all([
    getProducts(),
    getInventoryBalances(),
    listAdminOrders(),
    getCurrentStaff(),
  ]);

  return (
    <DashboardAdminView
      products={products}
      initialBalances={balances}
      initialOrders={orders}
      staffName={staff?.fullName}
      staffRole={staff?.role}
    />
  );
}
