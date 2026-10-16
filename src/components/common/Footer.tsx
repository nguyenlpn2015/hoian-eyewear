"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { MapPin, Phone, Clock, Shield, Sparkles, CheckCircle2 } from "lucide-react";

export function Footer() {
  const { t } = useApp();

  return (
    <footer className="bg-[#1A1715] text-[#FDFBF7] pt-14 pb-8 border-t border-[#2C2623]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#2C2623]">
          {/* Brand Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-serif text-[#D4AF37]">
              HOI AN EYEWEAR
            </h2>
            <p className="text-xs text-[#FDFBF7]/70 leading-relaxed">
              {t(
                "Thương hiệu kính mát đương đại kết hợp tinh hoa thủ công phố cổ Hội An. Bảo vệ đôi mắt trọn vẹn dưới ánh nắng biển nhiệt đới.",
                "Contemporary eyewear fusing Hoi An ancient heritage with cutting-edge UV400 & polarized optical protection."
              )}
            </p>
            <div className="flex items-center gap-3 pt-2 text-xs text-[#D4AF37]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% UV Protection
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Polarized
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-[#D4AF37]">
              {t("Bộ Sưu Tập", "Collections")}
            </h3>
            <ul className="space-y-2 text-xs text-[#FDFBF7]/70">
              <li>
                <Link href="/collections/aviator" className="hover:text-[#D4AF37] transition-colors">
                  {t("Kính Phi Công (Aviator)", "Aviator Sunglasses")}
                </Link>
              </li>
              <li>
                <Link href="/collections/cat-eye" className="hover:text-[#D4AF37] transition-colors">
                  {t("Kính Mắt Mèo (Cat-Eye)", "Cat-Eye Sunglasses")}
                </Link>
              </li>
              <li>
                <Link href="/collections/square" className="hover:text-[#D4AF37] transition-colors">
                  {t("Kính Vuông Du Lịch (Square)", "Square Sunglasses")}
                </Link>
              </li>
              <li>
                <Link href="/collections/round" className="hover:text-[#D4AF37] transition-colors">
                  {t("Kính Tròn Retro (Round)", "Round Retro")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Boutique Storefront */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-[#D4AF37]">
              {t("Cửa Hàng Thực Tế", "Flagship Boutique")}
            </h3>
            <ul className="space-y-2.5 text-xs text-[#FDFBF7]/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>123 Trần Phú, Phường Minh An, TP. Hội An, Quảng Nam</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>08:30 – 21:30 {t("hàng ngày", "daily")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>0905.123.456 (Zalo / Hotline)</span>
              </li>
            </ul>
          </div>

          {/* Customer Service & Policies */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-[#D4AF37]">
              {t("Chính Sách & Hỗ Trợ", "Customer Care")}
            </h3>
            <ul className="space-y-2 text-xs text-[#FDFBF7]/70">
              <li>
                <Link href="/track-order" className="hover:text-[#D4AF37] transition-colors flex items-center gap-1.5">
                  <span>{t("Tra cứu tiến độ đơn hàng", "Track your order")}</span>
                </Link>
              </li>
              <li>
                <span>{t("Miễn phí ship đơn từ 500.000 ₫", "Free shipping from 500,000 ₫")}</span>
              </li>
              <li>
                <span>{t("Chính sách 1 đổi 1 trong 7 ngày", "7-day exchange warranty")}</span>
              </li>
              <li>
                <span>{t("Hộp cứng cao cấp & khăn lau đi kèm", "Premium hard case & cloth included")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#FDFBF7]/50 gap-4">
          <p>© 2026 Hoi An Eyewear. All rights reserved. Made for Vietnam & World travelers.</p>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 bg-[#2C2623] rounded text-[#D4AF37] font-medium">
              ✓ Tiền mặt (COD)
            </span>
            <span className="px-2 py-1 bg-[#2C2623] rounded text-[#D4AF37] font-medium">
              ✓ Chuyển khoản VietQR
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
