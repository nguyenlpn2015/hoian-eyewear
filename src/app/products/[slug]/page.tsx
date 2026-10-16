"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS } from "@/data/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Store,
  RefreshCw,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const skuQuery = searchParams.get("sku");
  const router = useRouter();

  const { t, addToCart, getAvailableStock, setCartDrawerOpen } = useApp();

  const product = MOCK_PRODUCTS.find((p) => p.slug === slug);

  // Identify initial variant by skuQuery if present
  const initialVariantIndex =
    skuQuery && product
      ? Math.max(0, product.variants.findIndex((v) => v.sku === skuQuery))
      : 0;

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(initialVariantIndex);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  // If query sku changes
  useEffect(() => {
    if (skuQuery && product) {
      const idx = product.variants.findIndex((v) => v.sku === skuQuery);
      if (idx >= 0) setSelectedVariantIndex(idx);
    }
  }, [skuQuery, product]);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-bold text-[#1A1715]">
          {t("Không tìm thấy sản phẩm", "Product Not Found")}
        </h1>
        <p className="text-sm text-[#6E6962]">
          {t("Mẫu kính mát này có thể đã ngưng kinh doanh hoặc đường dẫn không đúng.", "This product might have been discontinued.")}
        </p>
        <Link href="/collections">
          <Button variant="primary" size="md">
            {t("Về danh mục kính mát", "Back to Collections")}
          </Button>
        </Link>
      </div>
    );
  }

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const availableStock = getAvailableStock(currentVariant.id);
  const isOutOfStock = availableStock <= 0;

  const handleSelectVariant = (idx: number) => {
    setSelectedVariantIndex(idx);
    setSelectedImageIndex(0);
    setQuantity(1);
    const varSku = product.variants[idx]?.sku;
    if (varSku) {
      router.replace(`/products/${product.slug}?sku=${varSku}`, { scroll: false });
    }
  };

  const handleAddToCart = () => {
    const success = addToCart(currentVariant, product, quantity);
    if (success) {
      setCartDrawerOpen(true);
    }
  };

  const handleBuyNow = () => {
    const success = addToCart(currentVariant, product, quantity);
    if (success) {
      router.push("/checkout");
    }
  };

  // Combine product gallery with current variant image
  const displayImages = [currentVariant.imageUrl, ...product.images.filter(img => img !== currentVariant.imageUrl)];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#6E6962]">
        <Link href="/" className="hover:text-[#1A1715]">{t("Trang Chủ", "Home")}</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#E6E0D5]" />
        <Link href="/collections" className="hover:text-[#1A1715]">{t("Kính Mát", "Sunglasses")}</Link>
        <ChevronRight className="w-3.5 h-3.5 text-[#E6E0D5]" />
        <span className="text-[#1A1715] font-medium truncate max-w-[200px] sm:max-w-none">
          {t(product.name_vi, product.name_en)}
        </span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        {/* LEFT: Image Gallery */}
        <div className="space-y-4">
          {/* Main Large Image */}
          <div className="relative aspect-4/5 w-full bg-[#F7F4EE] rounded-2xl overflow-hidden border border-[#E6E0D5] shadow-xs">
            <Image
              src={displayImages[selectedImageIndex] || displayImages[0]}
              alt={product.name_vi}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {currentVariant.isPolarized && (
              <span className="absolute top-4 left-4 bg-[#3E5345] text-white text-xs font-semibold px-2.5 py-1 rounded-sm flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                {t("Tròng Polarized Chống Chói", "Polarized Anti-Glare")}
              </span>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {displayImages.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative w-18 h-22 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                  selectedImageIndex === idx
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 scale-102"
                    : "border-[#E6E0D5] opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={imgUrl}
                  alt={`Thumbnail ${idx}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Variant Configuration & Purchasing */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="text-[11px] font-mono text-[#8C6D15] tracking-wider uppercase">
                SKU: {currentVariant.sku}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1715] font-serif mt-1">
                {t(product.name_vi, product.name_en)}
              </h1>
              <p className="text-xs text-[#6E6962] mt-1.5 leading-relaxed">
                {t(product.description_vi, product.description_en)}
              </p>
            </div>

            {/* Price & Stock Indicator */}
            <div className="flex items-baseline gap-3 p-3.5 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5]">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#1A1715]">
                {formatCurrency(currentVariant.price)}
              </span>
              {currentVariant.compareAtPrice && (
                <span className="text-sm text-[#6E6962] line-through">
                  {formatCurrency(currentVariant.compareAtPrice)}
                </span>
              )}

              <div className="ml-auto">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                    ✕ {t("Hết hàng", "Out of Stock")}
                  </span>
                ) : availableStock <= 3 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    ⚠️ {t(`Chỉ còn ${availableStock} chiếc tại Hội An`, `Only ${availableStock} left in stock`)}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ {t("Còn hàng tại Boutique Hội An", "In Stock at Hoi An Store")}
                  </span>
                )}
              </div>
            </div>

            {/* 1. MÀU GỌNG KÍNH (Color Swatches) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1A1715] uppercase tracking-wider">
                  {t("1. Màu Gọng Kính:", "1. Frame Color:")}{" "}
                  <span className="text-[#8C6D15] font-semibold">
                    {t(currentVariant.colorName_vi, currentVariant.colorName_en)}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3">
                {product.variants.map((variant, idx) => {
                  const isSelected = selectedVariantIndex === idx;
                  const vStock = getAvailableStock(variant.id);
                  const isVOutOfStock = vStock <= 0;

                  return (
                    <button
                      key={variant.id}
                      onClick={() => handleSelectVariant(idx)}
                      className={`group relative flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${
                        isSelected
                          ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-white"
                          : "border-[#E6E0D5] hover:border-[#1A1715] bg-[#FDFBF7]"
                      } ${isVOutOfStock ? "opacity-60" : ""}`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: variant.colorHex }}
                      />
                      <span className="text-xs font-medium text-[#1A1715]">
                        {t(variant.colorName_vi, variant.colorName_en)}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. KÍCH THƯỚC (Size Pill) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1A1715] uppercase tracking-wider">
                  {t("2. Kích Thước Khuôn Mặt:", "2. Fit & Size:")}
                </span>
                <span className="text-[#6E6962] text-[11px] flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#D4AF37]" />
                  {t("Kích thước chuẩn người Việt & Quốc tế", "Universal Asian & Global Fit")}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-[#1A1715] bg-[#1A1715] text-[#FDFBF7] shadow-xs cursor-default"
                >
                  {currentVariant.sizeLabel}
                </button>
              </div>
            </div>

            {/* 3. LOẠI TRÒNG KÍNH (Lens Type Selector) */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-[#1A1715] uppercase tracking-wider">
                {t("3. Công Nghệ Tròng Kính Đang Chọn:", "3. Selected Lens Tech:")}
              </div>

              <div className="p-3.5 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/10 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center text-[#8C6D15] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#1A1715]">
                    {t(currentVariant.lensType_vi, currentVariant.lensType_en)}
                  </h4>
                  <p className="text-[11px] text-[#6E6962] mt-0.5">
                    {currentVariant.isPolarized
                      ? t(
                          "Lọc 99% tia sáng phân cực phản xạ từ mặt biển, mặt đường. Chống chói lóa tuyệt đối.",
                          "Filters 99% of reflected surface glare from water and pavement. Superior optical clarity."
                        )
                      : t(
                          "Tròng kính hấp thụ 100% tia tử ngoại UVA & UVB theo tiêu chuẩn UV400 quốc tế.",
                          "Full spectrum absorption blocking 100% of harmful UVA & UVB radiation."
                        )}
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Stepper & Buttons (Desktop View) */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-[#E6E0D5] rounded-lg bg-white h-11 px-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="p-2 hover:bg-[#F7F4EE] text-[#1A1715] disabled:opacity-30 rounded-md transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-[#1A1715]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock || isOutOfStock}
                    className="p-2 hover:bg-[#F7F4EE] text-[#1A1715] disabled:opacity-30 rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 h-11"
                >
                  <span>
                    {isOutOfStock
                      ? t("Hết hàng", "Out of Stock")
                      : `${t("Thêm vào giỏ", "Add to Bag")} • ${formatCurrency(currentVariant.price * quantity)}`}
                  </span>
                </Button>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="w-full h-11"
              >
                <span>{t("Mua ngay — Giao tận nơi hoặc Nhận tại Hội An", "Buy Now — Delivery or Store Pickup")}</span>
              </Button>
            </div>
          </div>

          {/* Delivery & Assurance checklist */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#E6E0D5] text-xs text-[#6E6962]">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#D4AF37]" />
              <span>{t("Giao nhanh toàn quốc", "Nationwide express delivery")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-[#D4AF37]" />
              <span>{t("Có sẵn tại quầy Hội An", "Available at Hoi An boutique")}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-[#D4AF37]" />
              <span>{t("Đổi mẫu 7 ngày", "7-day exchange window")}</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>{t("Bao gồm hộp cứng & khăn lau", "Full case & cloth pack")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Frame Dimensions & Optical Specs */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6E0D5] space-y-6">
        <h3 className="text-base sm:text-lg font-bold text-[#1A1715] font-serif border-b border-[#F7F4EE] pb-3">
          {t("Thông Số Kỹ Thuật & Kích Thước Gọng Kính", "Frame Dimensions & Technical Specifications")}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5]">
            <span className="text-[10px] text-[#6E6962] uppercase tracking-wider block">
              {t("Chiều rộng tròng (Lens)", "Lens Width")}
            </span>
            <span className="text-lg font-bold text-[#1A1715] mt-1 block">
              {product.dimensions.lensWidth} mm
            </span>
          </div>

          <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5]">
            <span className="text-[10px] text-[#6E6962] uppercase tracking-wider block">
              {t("Cầu kính (Bridge)", "Bridge Width")}
            </span>
            <span className="text-lg font-bold text-[#1A1715] mt-1 block">
              {product.dimensions.bridgeWidth} mm
            </span>
          </div>

          <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5]">
            <span className="text-[10px] text-[#6E6962] uppercase tracking-wider block">
              {t("Chiều dài càng (Temple)", "Temple Length")}
            </span>
            <span className="text-lg font-bold text-[#1A1715] mt-1 block">
              {product.dimensions.templeLength} mm
            </span>
          </div>

          <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5]">
            <span className="text-[10px] text-[#6E6962] uppercase tracking-wider block">
              {t("Chất liệu gọng", "Frame Material")}
            </span>
            <span className="text-xs font-bold text-[#1A1715] mt-2 block truncate">
              {t(product.frameMaterial_vi, product.frameMaterial_en)}
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-t border-[#E6E0D5] p-3 px-4 flex items-center justify-between shadow-2xl">
        <div>
          <div className="text-xs font-bold text-[#1A1715] truncate max-w-[150px]">
            {t(product.name_vi, product.name_en)}
          </div>
          <div className="text-sm font-extrabold text-[#D4AF37]">
            {formatCurrency(currentVariant.price)}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className="h-10 px-4"
          >
            {isOutOfStock ? t("Hết hàng", "Out of Stock") : t("Thêm vào giỏ", "Add to Bag")}
          </Button>
        </div>
      </div>
    </div>
  );
}

