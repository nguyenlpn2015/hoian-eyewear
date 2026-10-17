"use client";

import React from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Product, InventoryBalance, Order } from "@/types";
import {
  DollarSign,
  Package,
  Store,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

interface DashboardAdminViewProps {
  products: Product[];
  initialBalances: Record<string, InventoryBalance>;
  initialOrders: Order[];
  staffName?: string;
  staffRole?: string;
}

export default function DashboardAdminView({
  products,
  initialBalances,
  initialOrders,
  staffName,
  staffRole,
}: DashboardAdminViewProps) {
  // Metrics calculated from real orders
  const totalRevenue = initialOrders
    .filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "verified")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = initialOrders.filter((o) => o.orderStatus === "pending").length;
  const pickupOrdersCount = initialOrders.filter(
    (o) => o.fulfillmentType === "pickup" && o.orderStatus !== "completed"
  ).length;

  // Identify low stock items (<= 3 available) from real products and balances
  const lowStockItems: Array<{
    variantId: string;
    productName: string;
    sku: string;
    variantDesc: string;
    onHand: number;
    reserved: number;
    available: number;
  }> = [];

  products.forEach((prod) => {
    prod.variants.forEach((v) => {
      const bal = initialBalances[v.id];
      if (bal && bal.quantityAvailable <= 3) {
        lowStockItems.push({
          variantId: v.id,
          productName: prod.name_vi,
          sku: v.sku,
          variantDesc: `${v.colorName_vi} / ${v.lensType_vi}`,
          onHand: bal.quantityOnHand,
          reserved: bal.quantityReserved,
          available: bal.quantityAvailable,
        });
      }
    });
  });

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick POS Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E6E0D5] shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase text-[#D4AF37] tracking-wider">
            Bảng Điều Khiển Vận Hành
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1715] font-serif mt-0.5">
            Tổng Quan Cửa Hàng Kính Mát Hội An
          </h1>
          <p className="text-xs text-[#6E6962] mt-1">
            Nhân viên: <strong className="text-[#1A1715]">{staffName || "Quản lý"}</strong> ({staffRole || "STAFF"}) • Đồng bộ bán lẻ đa kênh trực tiếp CSDL Supabase PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/pos">
            <Button variant="primary" size="md" className="shadow-md">
              <Store className="w-4 h-4 mr-1 text-[#1A1715]" />
              <span>Mở Bán Hàng Tại Quầy (POS)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">Doanh Thu Ghi Nhận</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1715]">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>Đã đối soát thanh toán</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">Đơn Mới Chờ Duyệt</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1715]">
            {pendingOrdersCount} đơn
          </div>
          <div className="text-[11px] text-[#6E6962]">
            Bao gồm đơn VietQR chờ đối soát
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">Đơn Nhận Tại Quầy</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1715]">
            {pickupOrdersCount} đơn
          </div>
          <div className="text-[11px] text-[#6E6962]">
            Khách sẽ ghé nhận tại 123 Trần Phú
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">Cảnh Báo Tồn Kho</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600">
            {lowStockItems.length} mẫu kính
          </div>
          <div className="text-[11px] text-red-700 font-medium">
            Có số lượng khả dụng ≤ 3 chiếc
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERTS TABLE */}
      <div className="bg-white rounded-2xl border border-[#E6E0D5] shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7F4EE] pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-[#1A1715]">
              Cảnh Báo Tồn Kho Thấp (Biến Thể Sắp Hết Hàng)
            </h2>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-bold text-[#8C6D15] hover:underline flex items-center gap-1"
          >
            <span>Quản lý toàn bộ kho</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4EE] text-[#6E6962] font-semibold border-b border-[#E6E0D5]">
              <tr>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Tên Sản Phẩm / Biến Thể</th>
                <th className="py-3 px-4 text-center">Tồn Thực Tế</th>
                <th className="py-3 px-4 text-center">Đang Giữ Chỗ</th>
                <th className="py-3 px-4 text-center">Khả Dụng Bán</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F4EE]">
              {lowStockItems.map((item) => (
                <tr key={item.variantId} className="hover:bg-[#FDFBF7]">
                  <td className="py-3 px-4 font-mono font-bold text-[#1A1715]">{item.sku}</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-[#1A1715]">{item.productName}</div>
                    <div className="text-[11px] text-[#6E6962]">{item.variantDesc}</div>
                  </td>
                  <td className="py-3 px-4 text-center font-medium text-[#1A1715]">{item.onHand}</td>
                  <td className="py-3 px-4 text-center text-[#6E6962]">{item.reserved}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {item.available} chiếc
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/inventory?adjust=${item.variantId}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <PlusCircle className="w-3 h-3 mr-1" />
                        <span>Nhập Thêm Kho</span>
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

