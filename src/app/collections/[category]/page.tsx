"use client";

import React, { use } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS, MOCK_CATEGORIES } from "@/data/mock-data";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowLeft } from "lucide-react";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: categorySlug } = use(params);
  const { t } = useApp();

  const currentCategory = MOCK_CATEGORIES.find((c) => c.slug === categorySlug);
  const categoryProducts = MOCK_PRODUCTS.filter(
    (p) => p.categoryId === currentCategory?.id
  );

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
          {currentCategory ? t(currentCategory.name_vi, currentCategory.name_en) : t("Danh Mục Kính Mát", "Category")}
        </h1>
        {currentCategory && (
          <p className="text-xs sm:text-sm text-[#6E6962] mt-1 max-w-2xl">
            {t(currentCategory.description_vi, currentCategory.description_en)}
          </p>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {categoryProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
