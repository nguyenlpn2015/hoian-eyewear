"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/data/mock-data";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  Truck,
  Store,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  MapPin,
  Clock,
  Compass,
} from "lucide-react";

export default function HomePage() {
  const { t } = useApp();

  const featuredProducts = MOCK_PRODUCTS.filter((p) => p.featured);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative w-full min-h-[540px] sm:min-h-[640px] flex items-center justify-center bg-[#1A1715] overflow-hidden">
        {/* Background Image with warm overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=1600&q=85"
            alt="Hoi An Eyewear Hero"
            fill
            priority
            className="object-cover opacity-45 scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#1A1715] via-[#1A1715]/40 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 pt-12 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("Bộ Sưu Tập Nắng Phố Cổ 2026", "Hoi An Summer Sunlight 2026")}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#FDFBF7] tracking-tight font-serif leading-tight">
            {t(
              "Bảo Vệ Đôi Mắt Dưới Ánh Nắng Phố Cổ & Nắng Biển",
              "Shield Your Eyes Under Hoi An Sun & Coastal Waves"
            )}
          </h1>

          <p className="text-sm sm:text-lg text-[#FDFBF7]/80 max-w-2xl mx-auto leading-relaxed">
            {t(
              "Kính mát thủ công kết hợp tròng kính Polarized chống lóa và UV400 chuẩn quang học. Thiết kế trẻ trung, tôn vinh nét đẹp hoài niệm di sản.",
              "Handcrafted eyewear engineered with anti-glare polarized and UV400 optical lenses. Elegant contemporary silhouettes honoring timeless heritage."
            )}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/collections" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <span>{t("Khám Phá Kính Mát Mới", "Explore Sunglasses")}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/collections/aviator" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-[#FDFBF7]/40 text-[#FDFBF7] hover:bg-[#FDFBF7]/10"
              >
                <span>{t("Dáng Kính Bán Chạy", "Best-Selling Aviators")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. USP COMMITMENT BAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 relative z-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-[#E6E0D5] shadow-lg">
          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center text-[#D4AF37] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1A1715]">
                {t("Tròng Polarized & UV400", "Polarized & UV400")}
              </h2>
              <p className="text-[11px] text-[#6E6962]">
                {t("Chống chói & tia tử ngoại 100%", "100% glare & UV protection")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center text-[#D4AF37] shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1A1715]">
                {t("Giao Hàng Toàn Quốc", "Nationwide Delivery")}
              </h2>
              <p className="text-[11px] text-[#6E6962]">
                {t("Miễn phí đơn từ 500.000 ₫", "Free shipping from 500k")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center text-[#D4AF37] shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1A1715]">
                {t("Nhận Tại Cửa Hàng 0đ", "In-Store Pickup 0₫")}
              </h2>
              <p className="text-[11px] text-[#6E6962]">
                {t("123 Trần Phú, Hội An", "Ready in 1 hour")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2">
            <div className="w-10 h-10 rounded-xl bg-[#F7F4EE] flex items-center justify-center text-[#D4AF37] shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-[#1A1715]">
                {t("Đổi Mới Trong 7 Ngày", "7-Day Exchange")}
              </h2>
              <p className="text-[11px] text-[#6E6962]">
                {t("Nếu không vừa khuôn mặt", "Guaranteed perfect fit")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES HIGHLIGHT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
            {t("Kiểu Dáng Đặc Trưng", "Signature Silhouettes")}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1715] font-serif">
            {t("Dáng Kính Cho Mọi Khuôn Mặt", "Designed For Every Face")}
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {MOCK_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="group relative aspect-3/4 rounded-xl overflow-hidden border border-[#E6E0D5] shadow-xs hover:shadow-md transition-all"
            >
              <Image
                src={cat.image}
                alt={cat.name_vi}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-[#1A1715]/90 via-[#1A1715]/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-sm sm:text-base font-bold font-serif group-hover:text-[#D4AF37] transition-colors">
                  {t(cat.name_vi, cat.name_en)}
                </h3>
                <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                  {t(cat.description_vi, cat.description_en)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. FEATURED PRODUCTS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E6E0D5] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              {t("Kính Mát Tuyển Chọn", "Curated Selection")}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1A1715] font-serif mt-1">
              {t("Được Yêu Thích Nhất Tại Phố Cổ", "Hoi An Most-Loved Shades")}
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-xs sm:text-sm font-semibold text-[#8C6D15] hover:text-[#1A1715] flex items-center gap-1"
          >
            <span>{t("Xem tất cả kính mát", "View All Sunglasses")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. HOI AN BOUTIQUE ATMOSPHERE & STORY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-[#F7F4EE] rounded-2xl p-6 sm:p-12 border border-[#E6E0D5]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#D4AF37] border border-[#E6E0D5] text-xs font-semibold">
              <Compass className="w-3.5 h-3.5" />
              <span>{t("Không Gian Boutique Phố Cổ", "Ancient Town Boutique")}</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A1715] font-serif leading-snug">
              {t(
                "Dừng Chân Thử Kính Giữa Lòng Phố Cổ Hội An",
                "Try On Shades In The Heart Of Historic Hoi An"
              )}
            </h2>

            <p className="text-xs sm:text-sm text-[#6E6962] leading-relaxed">
              {t(
                "Tọa lạc ngay trên con đường cổ Trần Phú lung linh hoa đăng, cửa hàng Hoi An Eyewear mang đến không gian thử kính thư thái. Bạn có thể đặt mua online và ghé lấy kính ngay trong ngày, hoặc thưởng thức một tách trà mạn trong lúc nhân viên căn chỉnh gọng vừa vặn khuôn mặt.",
                "Located on charming Tran Phu street adorned with glowing silk lanterns, our flagship boutique offers a relaxing eyewear consultation experience. Order online and pick up in-store, or enjoy a complimentary jasmine tea while our specialists adjust your frames."
              )}
            </p>

            <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#1A1715]">
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-medium">123 Trần Phú, Phường Minh An, TP. Hội An, Quảng Nam</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#D4AF37]" />
                <span>08:30 – 21:30 {t("hàng ngày (cả Thứ 7 & CN)", "daily including weekends")}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="https://maps.google.com/?q=Hoi+An+Ancient+Town"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary" size="md">
                  <span>{t("Xem Chỉ Đường Google Maps", "Get Directions")}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative aspect-4/3 sm:aspect-16/10 rounded-xl overflow-hidden shadow-md">
            <Image
              src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=1000&q=85"
              alt="Hoi An Eyewear Boutique Experience"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
