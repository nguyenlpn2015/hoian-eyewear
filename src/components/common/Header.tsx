"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ShoppingBag, Menu, X, Globe, Truck, Store } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Header() {
  const { language, setLanguage, t, cartCount, setCartDrawerOpen } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: t("Trang Chủ", "Home") },
    { href: "/collections", label: t("Toàn Bộ Kính Mát", "All Sunglasses") },
    { href: "/collections/aviator", label: t("Kính Phi Công", "Aviator") },
    { href: "/collections/cat-eye", label: t("Kính Mắt Mèo", "Cat-Eye") },
    { href: "/collections/square", label: t("Kính Vuông", "Square") },
    { href: "/track-order", label: t("Tra Cứu Đơn", "Track Order") },
  ];

  const isAdmin = pathname.startsWith("/admin");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    if (mobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#E6E0D5]">
      {/* Top Announcement Bar */}
      <div className="bg-[#1A1715] text-[#D4AF37] px-4 py-1.5 text-xs text-center font-medium flex items-center justify-center gap-2">
        <span>✨ {t("Miễn phí vận chuyển toàn quốc cho đơn từ 500.000 ₫", "Free nationwide shipping on orders from 500,000 ₫")}</span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span className="hidden sm:inline text-[#FDFBF7]/80">
          📍 {t("Trải nghiệm tại 123 Trần Phú, Hội An", "Visit our boutique at 123 Tran Phu, Hoi An")}
        </span>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Left: Mobile Hamburger & Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#1A1715] hover:bg-[#F7F4EE] rounded-md"
              aria-label={t("Mở/Đóng danh mục", "Toggle Menu")}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1715] font-serif">
                HOI AN EYEWEAR
              </span>
              <span className="text-[10px] tracking-widest text-[#D4AF37] font-medium uppercase -mt-1">
                Kính Mắt Phố Cổ • Est. 2026
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-[#D4AF37] ${
                  pathname === link.href ? "text-[#D4AF37] font-semibold" : "text-[#1A1715]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Action Icons & Toggles */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Portal Quick Switcher */}
            <Link
              href={isAdmin ? "/" : "/admin"}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-[#E6E0D5] bg-[#F7F4EE] hover:bg-[#EFECE4] text-[#1A1715] flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">{isAdmin ? t("Xem Cửa Hàng", "Storefront") : t("Quản Trị / POS", "Admin / POS")}</span>
            </Link>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded border border-[#E6E0D5] hover:border-[#D4AF37] transition-all bg-[#FDFBF7]"
              title="Chuyển đổi ngôn ngữ / Switch Language"
            >
              <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Track Order Icon Button */}
            <Link
              href="/track-order"
              className="p-2 text-[#1A1715] hover:text-[#D4AF37] hover:bg-[#F7F4EE] rounded-full transition-colors hidden sm:flex"
              title={t("Tra cứu đơn hàng", "Track Order")}
            >
              <Truck className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="relative p-2.5 bg-[#1A1715] text-[#FDFBF7] hover:bg-[#2C2623] rounded-full transition-transform active:scale-95 shadow-sm"
              aria-label="Giỏ hàng"
            >
              <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#1A1715] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FDFBF7]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[96px] z-50 bg-[#1A1715]/40 backdrop-blur-sm">
          <div className="bg-[#FDFBF7] border-b border-[#E6E0D5] px-6 py-6 space-y-4 shadow-xl">
            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-base font-medium text-[#1A1715] hover:text-[#D4AF37] py-1.5 border-b border-[#F7F4EE]"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/admin/pos"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button variant="secondary" size="md" className="w-full">
                  <Store className="w-4 h-4 text-[#D4AF37]" />
                  <span>{t("Bán Hàng Tại Quầy (POS)", "In-Store POS")}</span>
                </Button>
              </Link>

              <div className="text-xs text-[#6E6962] flex items-center justify-between pt-2">
                <span>Hotline: 0905.123.456 (8:30 - 21:30)</span>
                <span>Hội An, Việt Nam</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

