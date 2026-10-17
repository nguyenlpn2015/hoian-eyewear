"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { SlidersHorizontal, X, ArrowUpDown } from "lucide-react";
import { Product, Category } from "@/types";

interface CollectionsClientViewProps {
  initialProducts: Product[];
  categories: Category[];
  initialCategorySlug?: string;
}

export default function CollectionsClientView({
  initialProducts,
  categories,
  initialCategorySlug,
}: CollectionsClientViewProps) {
  const { t } = useApp();

  const initialCatId = useMemo(() => {
    if (!initialCategorySlug) return "all";
    const found = categories.find((c) => c.slug === initialCategorySlug);
    return found ? found.id : "all";
  }, [initialCategorySlug, categories]);

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCatId);
  const [selectedLensType, setSelectedLensType] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("default");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter logic
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategory !== "all" && product.categoryId !== selectedCategory) {
        return false;
      }

      // Lens Type filter
      if (selectedLensType === "polarized") {
        if (!product.variants.some((v) => v.isPolarized)) return false;
      } else if (selectedLensType === "uv400") {
        if (!product.variants.some((v) => !v.isPolarized)) return false;
      }

      // Color filter
      if (selectedColor !== "all") {
        if (
          !product.variants.some((v) =>
            v.colorName_en.toLowerCase().includes(selectedColor.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Price Range filter
      const minPrice = Math.min(...product.variants.map((v) => v.price));
      if (selectedPriceRange === "under-500") {
        if (minPrice >= 500000) return false;
      } else if (selectedPriceRange === "500-800") {
        if (minPrice < 500000 || minPrice > 800000) return false;
      } else if (selectedPriceRange === "over-800") {
        if (minPrice <= 800000) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price-asc") {
        return Math.min(...a.variants.map((v) => v.price)) - Math.min(...b.variants.map((v) => v.price));
      }
      if (sortBy === "price-desc") {
        return Math.max(...b.variants.map((v) => v.price)) - Math.max(...a.variants.map((v) => v.price));
      }
      return 0;
    });
  }, [initialProducts, selectedCategory, selectedLensType, selectedColor, selectedPriceRange, sortBy]);

  const resetFilters = () => {
    setSelectedCategory("all");
    setSelectedLensType("all");
    setSelectedColor("all");
    setSelectedPriceRange("all");
    setSortBy("default");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedLensType !== "all" ||
    selectedColor !== "all" ||
    selectedPriceRange !== "all";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="border-b border-[#E6E0D5] pb-6">
        <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
          {t("Bộ Sưu Tập Chính Hãng", "Authentic Sunglasses")}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1A1715] font-serif mt-1">
          {t("Kính Mát Hội An", "Hoi An Sunglasses Collection")}
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6962] mt-1.5 max-w-2xl">
          {t(
            "Toàn bộ gọng kính cao cấp được trang bị tròng quang học bảo vệ mắt toàn diện. Đặt online giao hàng tận nơi hoặc ghé boutique Hội An lấy ngay.",
            "All frames engineered with high-grade optical UV protection. Order online for nationwide delivery or collect in-store at Hoi An."
          )}
        </p>
      </div>

      {/* Control Bar: Filter Button (Mobile) & Sort By */}
      <div className="flex items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-[#E6E0D5] text-xs font-semibold text-[#1A1715] shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{t("Bộ lọc", "Filters")}</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            )}
          </button>

          <span className="text-xs text-[#6E6962]">
            {t(`Hiển thị ${filteredProducts.length} mẫu kính`, `Showing ${filteredProducts.length} sunglasses`)}
          </span>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#6E6962] hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-medium bg-white border border-[#E6E0D5] rounded-lg px-2.5 py-2 text-[#1A1715] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none cursor-pointer"
          >
            <option value="default">{t("Mặc định (Nổi bật nhất)", "Featured First")}</option>
            <option value="price-asc">{t("Giá: Thấp đến Cao", "Price: Low to High")}</option>
            <option value="price-desc">{t("Giá: Cao đến Thấp", "Price: High to Low")}</option>
          </select>
        </div>
      </div>

      {/* Main Content Layout (Sidebar + Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block space-y-6 bg-white p-5 rounded-xl border border-[#E6E0D5] h-fit">
          <div className="flex items-center justify-between border-b border-[#F7F4EE] pb-3">
            <h3 className="text-sm font-bold text-[#1A1715] uppercase tracking-wider">
              {t("Bộ Lọc Kính Mát", "Filter Eyewear")}
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-[#8C6D15] hover:underline"
              >
                {t("Xóa lọc", "Reset")}
              </button>
            )}
          </div>

          {/* Dáng Kính (Categories) */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#1A1715] uppercase">
              {t("Dáng Kính", "Silhouettes")}
            </h4>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === "all"}
                  onChange={() => setSelectedCategory("all")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Tất cả kiểu dáng", "All Categories")}</span>
              </label>
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.id}
                    onChange={() => setSelectedCategory(cat.id)}
                    className="accent-[#D4AF37]"
                  />
                  <span>{t(cat.name_vi, cat.name_en)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Công Nghệ Tròng Kính */}
          <div className="space-y-2.5 pt-4 border-t border-[#F7F4EE]">
            <h4 className="text-xs font-bold text-[#1A1715] uppercase">
              {t("Công Nghệ Tròng Kính", "Lens Technology")}
            </h4>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lens"
                  checked={selectedLensType === "all"}
                  onChange={() => setSelectedLensType("all")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Tất cả loại tròng", "All Lens Types")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lens"
                  checked={selectedLensType === "polarized"}
                  onChange={() => setSelectedLensType("polarized")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Tròng Polarized Chống Chói", "Polarized Anti-Glare")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="lens"
                  checked={selectedLensType === "uv400"}
                  onChange={() => setSelectedLensType("uv400")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Tròng UV400 Tiêu Chuẩn", "Standard UV400")}</span>
              </label>
            </div>
          </div>

          {/* Khoảng Giá */}
          <div className="space-y-2.5 pt-4 border-t border-[#F7F4EE]">
            <h4 className="text-xs font-bold text-[#1A1715] uppercase">
              {t("Khoảng Giá", "Price Range")}
            </h4>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPriceRange === "all"}
                  onChange={() => setSelectedPriceRange("all")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Tất cả mức giá", "All Prices")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPriceRange === "under-500"}
                  onChange={() => setSelectedPriceRange("under-500")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Dưới 500.000 ₫", "Under 500,000 ₫")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPriceRange === "500-800"}
                  onChange={() => setSelectedPriceRange("500-800")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("500.000 ₫ – 800.000 ₫", "500,000 ₫ – 800,000 ₫")}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  checked={selectedPriceRange === "over-800"}
                  onChange={() => setSelectedPriceRange("over-800")}
                  className="accent-[#D4AF37]"
                />
                <span>{t("Trên 800.000 ₫", "Over 800,000 ₫")}</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid (3 cols desktop, 2 cols mobile) */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-[#E6E0D5] text-center space-y-4">
              <div className="w-16 h-16 bg-[#F7F4EE] rounded-full flex items-center justify-center mx-auto text-2xl">
                🔍
              </div>
              <h3 className="text-base font-bold text-[#1A1715]">
                {t("Không tìm thấy mẫu kính phù hợp", "No sunglasses match your criteria")}
              </h3>
              <p className="text-xs text-[#6E6962] max-w-sm mx-auto">
                {t(
                  "Hãy thử nới lỏng bộ lọc hoặc xóa các điều kiện để xem toàn bộ bộ sưu tập.",
                  "Try adjusting or resetting your filters to explore all available models."
                )}
              </p>
              <Button variant="primary" size="sm" onClick={resetFilters}>
                {t("Xóa toàn bộ bộ lọc", "Reset All Filters")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileFilterOpen(false)}
            className="fixed inset-0 bg-[#1A1715]/40 backdrop-blur-xs"
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full p-6 flex flex-col justify-between shadow-2xl z-10">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between border-b border-[#E6E0D5] pb-4">
                <h3 className="text-base font-bold text-[#1A1715]">
                  {t("Bộ Lọc Sản Phẩm", "Filter Products")}
                </h3>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 text-[#6E6962]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dáng kính */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase">{t("Dáng kính", "Silhouettes")}</h4>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`block w-full text-left py-1 ${selectedCategory === "all" ? "text-[#D4AF37] font-bold" : ""}`}
                  >
                    {t("Tất cả", "All")}
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`block w-full text-left py-1 ${selectedCategory === c.id ? "text-[#D4AF37] font-bold" : ""}`}
                    >
                      {t(c.name_vi, c.name_en)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loại tròng */}
              <div className="space-y-2 pt-2 border-t border-[#F7F4EE]">
                <h4 className="text-xs font-bold uppercase">{t("Loại tròng", "Lens")}</h4>
                <div className="space-y-1.5 text-xs">
                  <button
                    onClick={() => setSelectedLensType("all")}
                    className={`block w-full text-left py-1 ${selectedLensType === "all" ? "text-[#D4AF37] font-bold" : ""}`}
                  >
                    {t("Tất cả", "All")}
                  </button>
                  <button
                    onClick={() => setSelectedLensType("polarized")}
                    className={`block w-full text-left py-1 ${selectedLensType === "polarized" ? "text-[#D4AF37] font-bold" : ""}`}
                  >
                    {t("Polarized Chống Chói", "Polarized")}
                  </button>
                  <button
                    onClick={() => setSelectedLensType("uv400")}
                    className={`block w-full text-left py-1 ${selectedLensType === "uv400" ? "text-[#D4AF37] font-bold" : ""}`}
                  >
                    {t("UV400 Tiêu Chuẩn", "UV400")}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E6E0D5] flex gap-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={resetFilters}
              >
                {t("Đặt lại", "Reset")}
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                onClick={() => setMobileFilterOpen(false)}
              >
                {t("Xem kết quả", "Apply")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

