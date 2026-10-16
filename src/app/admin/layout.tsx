"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { getCurrentStaff, signOutStaff } from "@/app/admin/actions";
import type { StaffRole } from "@/types/database";
import {
  LayoutDashboard,
  Store,
  Glasses,
  Warehouse,
  ClipboardList,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  User,
  AlertCircle,
} from "lucide-react";

interface StaffInfo {
  id: string;
  fullName: string;
  role: StaffRole;
  isActive: boolean;
  email?: string;
  isDevSession?: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useApp();
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [isPending, startTransition] = useTransition();

  const notice = searchParams.get("notice");

  useEffect(() => {
    if (pathname === "/admin/login") return;

    let mounted = true;
    getCurrentStaff().then((res) => {
      if (mounted && res) {
        setStaff(res);
      }
    });

    return () => {
      mounted = false;
    };
  }, [pathname]);

  // If on login page, render clean layout without admin navigation
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleSignOut = () => {
    startTransition(async () => {
      await signOutStaff();
    });
  };

  const allAdminNav = [
    {
      href: "/admin",
      label: t("Tổng Quan", "Dashboard"),
      icon: LayoutDashboard,
      roles: ["STORE_MANAGER"],
    },
    {
      href: "/admin/pos",
      label: t("Bán Tại Quầy (POS)", "In-Store POS"),
      icon: Store,
      roles: ["STORE_MANAGER", "CASHIER"],
    },
    {
      href: "/admin/products",
      label: t("Sản Phẩm & Biến Thể", "Products & Variants"),
      icon: Glasses,
      roles: ["STORE_MANAGER"],
    },
    {
      href: "/admin/inventory",
      label: t("Kho Hàng Thời Gian Thực", "Real-Time Stock"),
      icon: Warehouse,
      roles: ["STORE_MANAGER"],
    },
    {
      href: "/admin/orders",
      label: t("Quản Lý Đơn Hàng", "Orders & Fulfillment"),
      icon: ClipboardList,
      roles: ["STORE_MANAGER"],
    },
  ];

  // Filter tabs according to staff role
  const currentRole = staff?.role || "STORE_MANAGER";
  const visibleNav = allAdminNav.filter((nav) => nav.roles.includes(currentRole));

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

        <div className="flex items-center gap-4">
          {/* Staff Profile Badge */}
          {staff && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div className="w-6 h-6 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white leading-tight">
                  {staff.fullName}
                </span>
                <span className="text-[10px] text-[#D4AF37] leading-tight flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  {staff.role === "STORE_MANAGER" ? "Quản Lý Cửa Hàng" : "Thu Ngân POS"}
                  {staff.isDevSession && " (Dev)"}
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            disabled={isPending}
            className="text-xs text-[#A69E95] hover:text-red-400 flex items-center gap-1 font-medium transition-colors cursor-pointer"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Đăng Xuất</span>
          </button>

          <div className="h-3 w-px bg-[#3D3530] hidden sm:block" />

          {/* Back to Retail Storefront */}
          <Link
            href="/"
            className="text-xs text-[#D4AF37] hover:text-white flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("Về Cửa Hàng Bán Lẻ", "Back to Storefront")}</span>
          </Link>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="bg-white border-b border-[#E6E0D5] px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2">
          {visibleNav.map((nav) => {
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

      {/* Notice Alert Banner for Cashier access restrictions */}
      {notice === "restricted_cashier_access" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-800 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Tài khoản của bạn có quyền <strong>Thu Ngân (CASHIER)</strong> nên chỉ được phép truy cập màn hình <strong>Bán Tại Quầy (POS)</strong>. Các trang quản trị danh mục, kho hàng và đơn hàng toàn diện chỉ dành riêng cho <strong>Quản Lý (STORE_MANAGER)</strong>.
            </span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
