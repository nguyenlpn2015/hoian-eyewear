"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowLeft } from "lucide-react";
import { Product, Category } from "@/types";

interface CategoryClientViewProps {
  category?: Category;
  products: Product[];
}

export default function CategoryClientView({
  category,
  products,
}: CategoryClientViewProps) {
  const { t } = useApp();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Back button & Breadcrumbs */}
      <div>
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C6D15] hover:text-[#1A1715] transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Xem tất cả kính mát", "All Sunglasses")}</span>
        </Link>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1A1715] font-serif">
          {category ? t(category.name_vi, category.name_en) : t("Danh Mục Kính Mát", "Category")}
        </h1>
        {category && (
          <p className="text-xs sm:text-sm text-[#6E6962] mt-1 max-w-2xl">
            {t(category.description_vi, category.description_en)}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
