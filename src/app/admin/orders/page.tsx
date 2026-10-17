import React from "react";
import { listAdminOrders } from "@/lib/data/orders";
import { getCurrentStaff } from "@/app/admin/actions";
import OrdersAdminView from "@/components/admin/OrdersAdminView";

export default async function AdminOrdersPage() {
  const [orders, staff] = await Promise.all([
    listAdminOrders(),
    getCurrentStaff(),
  ]);

  return <OrdersAdminView initialOrders={orders} staffRole={staff?.role} />;
}
