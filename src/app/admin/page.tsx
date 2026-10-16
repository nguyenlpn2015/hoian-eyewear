"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS } from "@/data/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  DollarSign,
  Package,
  Store,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  TrendingUp,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { orders, inventory, t } = useApp();

  // Metrics
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "paid" || o.paymentStatus === "verified")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) => o.orderStatus === "pending").length;
  const pickupOrdersCount = orders.filter((o) => o.fulfillmentType === "pickup" && o.orderStatus !== "completed").length;

  // Identify low stock items (<= 3 available)
  const lowStockItems: Array<{
    variantId: string;
    productName: string;
    sku: string;
    variantDesc: string;
    onHand: number;
    reserved: number;
    available: number;
  }> = [];

  MOCK_PRODUCTS.forEach((prod) => {
    prod.variants.forEach((v) => {
      const bal = inventory[v.id];
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
            {t("Bảng Điều Khiển Vận Hành", "Operations Overview")}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1715] font-serif mt-0.5">
            {t("Tổng Quan Cửa Hàng Kính Mát Hội An", "Hoi An Boutique Overview")}
          </h1>
          <p className="text-xs text-[#6E6962] mt-1">
            {t("Theo dõi bán lẻ đa kênh trực tiếp giữa cửa hàng và online.", "Real-time omnichannel sales & inventory sync.")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/pos">
            <Button variant="primary" size="md" className="shadow-md">
              <Store className="w-4 h-4 mr-1 text-[#1A1715]" />
              <span>{t("Mở Bán Hàng Tại Quầy (POS)", "Open In-Store POS")}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">{t("Doanh Thu Hôm Nay", "Today's Revenue")}</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1715]">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3 h-3" />
            <span>+18% so với hôm qua</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">{t("Đơn Mới Chờ Duyệt", "Pending Orders")}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1715]">
            {pendingOrdersCount} {t("đơn", "orders")}
          </div>
          <div className="text-[11px] text-[#6E6962]">
            {t("Bao gồm đơn VietQR chờ kiểm tra", "Includes unconfirmed bank transfers")}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">{t("Đơn Nhận Tại Quầy", "In-Store Pickups")}</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#1A1715]">
            {pickupOrdersCount} {t("đơn", "orders")}
          </div>
          <div className="text-[11px] text-[#6E6962]">
            {t("Khách sẽ ghé nhận tại 123 Trần Phú", "Pick up at Hoi An boutique")}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#6E6962]">
            <span className="text-xs font-semibold">{t("Cảnh Báo Tồn Kho", "Low Stock Alerts")}</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-red-600">
            {lowStockItems.length} {t("mẫu kính", "SKUs")}
          </div>
          <div className="text-[11px] text-red-700 font-medium">
            {t("Có số lượng khả dụng ≤ 3 chiếc", "Available quantity ≤ 3 units")}
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERTS TABLE */}
      <div className="bg-white rounded-2xl border border-[#E6E0D5] shadow-xs overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F7F4EE] pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold text-[#1A1715]">
              {t("Cảnh Báo Tồn Kho Thấp (Biến Thể Sắp Hết Hàng)", "Low-Stock SKU Alerts")}
            </h2>
          </div>
          <Link
            href="/admin/inventory"
            className="text-xs font-bold text-[#8C6D15] hover:underline flex items-center gap-1"
          >
            <span>{t("Quản lý toàn bộ kho", "Manage All Stock")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4EE] text-[#6E6962] font-semibold border-b border-[#E6E0D5]">
              <tr>
                <th className="py-3 px-4">{t("Mã SKU", "SKU")}</th>
                <th className="py-3 px-4">{t("Tên Sản Phẩm / Biến Thể", "Product & Variant")}</th>
                <th className="py-3 px-4 text-center">{t("Tồn Thực Tế", "On-Hand")}</th>
                <th className="py-3 px-4 text-center">{t("Đang Giữ Chỗ", "Reserved")}</th>
                <th className="py-3 px-4 text-center">{t("Khả Dụng Bán", "Available")}</th>
                <th className="py-3 px-4 text-right">{t("Hành Động", "Action")}</th>
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
                      {item.available} {t("chiếc", "units")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/inventory?adjust=${item.variantId}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <PlusCircle className="w-3 h-3 mr-1" />
                        <span>{t("Nhập Thêm Kho", "Restock")}</span>
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

