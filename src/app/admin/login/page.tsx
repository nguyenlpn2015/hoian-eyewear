"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signInStaff, setDevRole } from "@/app/admin/actions";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  ArrowLeft,
  KeyRound,
  UserCheck,
  Store,
} from "lucide-react";

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "";
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === "account_disabled"
      ? "Tài khoản nhân viên này hiện đang bị tạm khóa. Vui lòng liên hệ quản lý."
      : null
  );
  const [isPending, startTransition] = useTransition();

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    if (nextUrl) formData.append("next", nextUrl);

    startTransition(async () => {
      const res = await signInStaff(formData);
      if (res && !res.success && res.error) {
        setErrorMessage(res.error);
      }
    });
  };

  const handleDevLogin = (role: "STORE_MANAGER" | "CASHIER") => {
    setErrorMessage(null);
    startTransition(async () => {
      await setDevRole(role, nextUrl || undefined);
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex flex-col justify-center items-center px-4 py-12">
      {/* Back to Storefront Link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C827A] hover:text-[#1A1715] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ cửa hàng Hội An Eyewear</span>
        </Link>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E6E0D5] overflow-hidden">
        {/* Header Header */}
        <div className="bg-[#1A1715] px-8 py-8 text-center border-b border-[#2C2623] relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-wide">
            HỘI AN EYEWEAR
          </h1>
          <p className="text-xs text-[#D4AF37] font-medium mt-1 uppercase tracking-wider">
            Cổng Đăng Nhập Quản Trị Nội Bộ
          </p>
          <p className="text-[11px] text-[#A69E95] mt-1">
            Boutique 123 Trần Phú, Hội An
          </p>
        </div>

        {/* Content Body */}
        <div className="p-8">
          {errorMessage && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1.5">
                Email nhân viên
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@hoianeyewear.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-[#1A1715] placeholder:text-[#A69E95] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-[#8C827A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-[#1A1715] placeholder:text-[#A69E95] focus:outline-hidden focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#1A1715] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 py-3 bg-[#1A1715] text-[#FDFBF7] hover:bg-[#2C2623] hover:text-[#D4AF37] rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {isPending ? "Đang xác thực..." : "Đăng Nhập Quản Trị"}
            </button>
          </form>

          {/* Development Quick-Login Helper */}
          <div className="mt-8 pt-6 border-t border-[#E6E0D5]">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold text-[#8C827A] uppercase tracking-wider">
                Kiểm Thử Nhanh (Dev Quick-Login)
              </span>
            </div>
            <p className="text-[11px] text-[#8C827A] mb-3 leading-relaxed">
              Dành cho môi trường phát triển & kiểm duyệt tính năng phân quyền:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDevLogin("STORE_MANAGER")}
                className="p-2.5 text-left bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#DDD6C8] rounded-xl transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1715] group-hover:text-[#9E2A2B]">
                  <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Quản Lý Cửa Hàng</span>
                </div>
                <div className="text-[10px] text-[#8C827A] mt-0.5">
                  STORE_MANAGER (Toàn quyền)
                </div>
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDevLogin("CASHIER")}
                className="p-2.5 text-left bg-[#FAF8F5] hover:bg-[#F2ECE1] border border-[#DDD6C8] rounded-xl transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1715] group-hover:text-[#9E2A2B]">
                  <Store className="w-3.5 h-3.5 text-[#2A9D8F]" />
                  <span>Thu Ngân POS</span>
                </div>
                <div className="text-[10px] text-[#8C827A] mt-0.5">
                  CASHIER (Chỉ vào quầy POS)
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#FAF8F5] px-8 py-3.5 border-t border-[#E6E0D5] text-center">
          <p className="text-[10px] text-[#A69E95]">
            Hệ thống quản trị bảo mật 2 lớp • Hội An Eyewear Architecture v2.0
          </p>
        </div>
      </div>
    </div>
  );
}

