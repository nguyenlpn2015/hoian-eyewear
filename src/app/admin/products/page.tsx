"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS } from "@/data/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Glasses, Search, Plus, Sparkles } from "lucide-react";

export default function AdminProductsPage() {
  const { t, getAvailableStock } = useApp();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = MOCK_PRODUCTS.filter(
    (p) =>
      p.name_vi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E0D5] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1715] font-serif">
            {t("Quản Lý Sản Phẩm & Biến Thể", "Products & Variants Management")}
          </h1>
          <p className="text-xs text-[#6E6962] mt-0.5">
            {t("Danh mục kính mát, bảng giá biến thể và mã SKU duy nhất.", "Eyewear catalog, variant pricing, and unique SKU enforcement.")}
          </p>
        </div>

        <Button variant="primary" size="sm" className="shadow-xs">
          <Plus className="w-4 h-4 mr-1" />
          <span>{t("Thêm Sản Phẩm Mới", "Add Product")}</span>
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#6E6962] absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên kính hoặc mã SKU..."
          className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-[#E6E0D5] bg-white focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
        />
      </div>

      {/* Products & Variants Accordion / Table */}
      <div className="space-y-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-[#E6E0D5] shadow-xs overflow-hidden"
          >
            {/* Product Header Row */}
            <div className="p-4 sm:p-5 bg-[#FDFBF7] border-b border-[#F7F4EE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="relative w-12 h-14 bg-[#F7F4EE] rounded-lg overflow-hidden shrink-0 border border-[#E6E0D5]">
                  <Image
                    src={product.images[0]}
                    alt={product.name_vi}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1A1715]">{product.name_vi}</h3>
                    <span className="text-[10px] bg-[#EFECE4] px-2 py-0.5 rounded text-[#6E6962] font-mono">
                      /{product.slug}
                    </span>
                  </div>
                  <div className="text-xs text-[#6E6962] mt-0.5">
                    {product.name_en} • {product.variants.length} biến thể
                  </div>
                </div>
              </div>

              <div className="text-xs text-[#6E6962] flex items-center gap-4">
                <span>Chất liệu: <strong className="text-[#1A1715]">{product.frameMaterial_vi}</strong></span>
              </div>
            </div>

            {/* Variants Sub-table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F7F4EE] text-[#6E6962] font-semibold border-b border-[#E6E0D5]">
                  <tr>
                    <th className="py-2.5 px-4">Mã SKU</th>
                    <th className="py-2.5 px-4">Màu Sắc Gọng</th>
                    <th className="py-2.5 px-4">Kích Thước</th>
                    <th className="py-2.5 px-4">Công Nghệ Tròng</th>
                    <th className="py-2.5 px-4">Giá Bán</th>
                    <th className="py-2.5 px-4 text-center">Tồn Khả Dụng</th>
                    <th className="py-2.5 px-4 text-right">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7F4EE]">
                  {product.variants.map((variant) => {
                    const avail = getAvailableStock(variant.id);
                    return (
                      <tr key={variant.id} className="hover:bg-[#FDFBF7]">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#8C6D15]">
                          {variant.sku}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: variant.colorHex }}
                            />
                            <span>{variant.colorName_vi}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-[#6E6962]">{variant.sizeLabel}</td>
                        <td className="py-2.5 px-4">
                          <span className="flex items-center gap-1 font-medium text-[#1A1715]">
                            {variant.isPolarized && <Sparkles className="w-3 h-3 text-[#D4AF37]" />}
                            {variant.lensType_vi}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-bold text-[#1A1715]">
                          {formatCurrency(variant.price)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              avail <= 3 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {avail} chiếc
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[11px] font-medium border border-emerald-200">
                            Đang Bán
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

