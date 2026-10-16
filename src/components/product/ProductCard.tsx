"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/Badge";
import { Sparkles } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const { t, getAvailableStock } = useApp();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);

  const currentVariant = product.variants[selectedVariantIndex] || product.variants[0];
  const minPrice = Math.min(...product.variants.map((v) => v.price));
  const maxPrice = Math.max(...product.variants.map((v) => v.price));
  const isMultiplePrices = minPrice !== maxPrice;

  // Check if all variants are out of stock
  const totalStock = product.variants.reduce(
    (sum, v) => sum + getAvailableStock(v.id),
    0
  );
  const isOutOfStock = totalStock === 0;

  return (
    <div className="group flex flex-col bg-white rounded-xl border border-[#E6E0D5] overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Product Image Area */}
      <Link
        href={`/products/${product.slug}?sku=${currentVariant.sku}`}
        className="relative aspect-4/5 w-full bg-[#F7F4EE] overflow-hidden block"
      >
        <Image
          src={currentVariant.imageUrl || product.images[0]}
          alt={product.name_vi}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start z-10">
          {product.tag_vi && (
            <span className="bg-[#D4AF37] text-[#1A1715] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm shadow-xs">
              {t(product.tag_vi, product.tag_en || "")}
            </span>
          )}
          {currentVariant.isPolarized && (
            <span className="bg-[#3E5345] text-white text-[10px] font-medium px-2 py-0.5 rounded-sm flex items-center gap-1 shadow-xs">
              <Sparkles className="w-2.5 h-2.5" /> Polarized
            </span>
          )}
        </div>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-[#1A1715]/40 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-[#1A1715] text-[#FDFBF7] text-xs font-bold px-3 py-1 rounded-md">
              {t("Hết hàng", "Out of Stock")}
            </span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between bg-white">
        <div>
          {/* Color Swatches */}
          <div className="flex items-center gap-1.5 mb-2">
            {product.variants.map((variant, idx) => (
              <button
                key={variant.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariantIndex(idx);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  selectedVariantIndex === idx
                    ? "ring-2 ring-[#D4AF37] ring-offset-1 scale-110"
                    : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: variant.colorHex }}
                title={t(variant.colorName_vi, variant.colorName_en)}
                aria-label={variant.colorName_vi}
              />
            ))}
            <span className="text-[10px] text-[#6E6962] ml-1">
              ({product.variants.length} {t("màu", "colors")})
            </span>
          </div>

          {/* Title */}
          <Link
            href={`/products/${product.slug}?sku=${currentVariant.sku}`}
            className="block"
          >
            <h3 className="text-sm font-semibold text-[#1A1715] line-clamp-1 group-hover:text-[#D4AF37] transition-colors">
              {t(product.name_vi, product.name_en)}
            </h3>
          </Link>

          {/* Lens Spec */}
          <p className="text-xs text-[#6E6962] mt-0.5 line-clamp-1">
            {t(currentVariant.lensType_vi, currentVariant.lensType_en)}
          </p>
        </div>

        {/* Price & Action */}
        <div className="mt-3 pt-2.5 border-t border-[#F7F4EE] flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-[#1A1715]">
              {isMultiplePrices
                ? `${t("Từ", "From")} ${formatCurrency(minPrice)}`
                : formatCurrency(currentVariant.price)}
            </div>
            {currentVariant.compareAtPrice && (
              <div className="text-[11px] text-[#6E6962] line-through -mt-0.5">
                {formatCurrency(currentVariant.compareAtPrice)}
              </div>
            )}
          </div>

          <Link
            href={`/products/${product.slug}?sku=${currentVariant.sku}`}
            className="text-xs font-semibold text-[#8C6D15] hover:text-[#1A1715] transition-colors"
          >
            {t("Xem kính →", "View →")}
          </Link>
        </div>
      </div>
    </div>
  );
}
