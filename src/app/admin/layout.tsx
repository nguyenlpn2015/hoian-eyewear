"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  LayoutDashboard,
  Store,
  Glasses,
  Warehouse,
  ClipboardList,
  ArrowLeft,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useApp();

  const adminNav = [
    { href: "/admin", label: t("Tổng Quan", "Dashboard"), icon: LayoutDashboard },
    { href: "/admin/pos", label: t("Bán Tại Quầy (POS)", "In-Store POS"), icon: Store },
    { href: "/admin/products", label: t("Sản Phẩm & Biến Thể", "Products & Variants"), icon: Glasses },
    { href: "/admin/inventory", label: t("Kho Hàng Thời Gian Thực", "Real-Time Stock"), icon: Warehouse },
    { href: "/admin/orders", label: t("Quản Lý Đơn Hàng", "Orders & Fulfillment"), icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#F7F4EE]">
      {/* Top Admin Sub-bar */}
      <div className="bg-[#1A1715] text-[#FDFBF7] px-4 sm:px-8 py-2.5 flex items-center justify-between border-b border-[#2C2623]">
        <div className="flex items-center gap-3">
          <span className="font-serif font-bold text-sm text-[#D4AF37]">
            HOI AN EYEWEAR — CỔNG QUẢN TRỊ NỘI BỘ
          </span>
          <span className="text-[10px] bg-[#D4AF37]/20 text-[#D4AF37] px-2 py-0.5 rounded font-mono">
            Boutique Hội An
          </span>
        </div>

        <Link
          href="/"
          className="text-xs text-[#D4AF37] hover:text-white flex items-center gap-1 font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Về Cửa Hàng Bán Lẻ", "Back to Storefront")}</span>
        </Link>
      </div>

      {/* Admin Nav Tabs */}
      <div className="bg-white border-b border-[#E6E0D5] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          {adminNav.map((nav) => {
            const Icon = nav.icon;
            const isActive = pathname === nav.href;
            return (
              <Link
                key={nav.href}
                href={nav.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#D4AF37] text-[#1A1715] shadow-xs"
                    : "text-[#6E6962] hover:text-[#1A1715] hover:bg-[#F7F4EE]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{nav.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}

