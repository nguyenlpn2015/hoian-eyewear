"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS } from "@/data/mock-data";
import { Button } from "@/components/ui/Button";
import {
  Edit,
  X,
  CheckCircle2,
} from "lucide-react";

function InventoryContent() {
  const searchParams = useSearchParams();
  const preselectedVariant = searchParams.get("adjust");

  const { inventory, adjustInventory, t } = useApp();

  const [activeModalVariantId, setActiveModalVariantId] = useState<string | null>(
    preselectedVariant || null
  );
  const [adjustmentType, setAdjustmentType] = useState<"increase" | "decrease">("increase");
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState("REPLENISHMENT");
  const [adjustNotes, setAdjustNotes] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const allVariants = MOCK_PRODUCTS.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      productName: p.name_vi,
      productName_en: p.name_en,
    }))
  );

  const selectedVariant = allVariants.find((v) => v.id === activeModalVariantId);
  const selectedBalance = selectedVariant ? inventory[selectedVariant.id] : null;

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalVariantId) return;

    const delta = adjustmentType === "increase" ? adjustQty : -adjustQty;
    adjustInventory(activeModalVariantId, delta, adjustReason);

    setToastMessage(
      `Đã cập nhật tồn kho cho SKU ${selectedVariant?.sku} (${delta > 0 ? `+${delta}` : delta} chiếc)`
    );
    setActiveModalVariantId(null);
    setAdjustQty(1);
    setAdjustNotes("");
    setTimeout(() => setToastMessage(""), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6E0D5] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1715] font-serif">
            {t("Quản Lý Kho Hàng Thời Gian Thực", "Real-Time Shared Inventory")}
          </h1>
          <p className="text-xs text-[#6E6962] mt-0.5">
            {t("Kho Boutique Hội An (HOI_AN_MAIN) • Nguồn tồn kho dùng chung cho cả Online và Tại Quầy", "Boutique Hoi An Stockroom • Authoritative Shared Source")}
          </p>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Real-Time Balances Table */}
      <div className="bg-white rounded-2xl border border-[#E6E0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F4EE] text-[#6E6962] font-semibold border-b border-[#E6E0D5]">
              <tr>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4">Sản Phẩm & Biến Thể</th>
                <th className="py-3 px-4 text-center">Tồn Thực Tế (On-Hand)</th>
                <th className="py-3 px-4 text-center">Đang Giữ Chỗ (Reserved)</th>
                <th className="py-3 px-4 text-center">Khả Dụng (Available)</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F4EE]">
              {allVariants.map((variant) => {
                const bal = inventory[variant.id] || {
                  quantityOnHand: 0,
                  quantityReserved: 0,
                  quantityAvailable: 0,
                };
                const isLow = bal.quantityAvailable <= 3;

                return (
                  <tr key={variant.id} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-4 font-mono font-bold text-[#8C6D15]">
                      {variant.sku}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#1A1715]">{variant.productName}</div>
                      <div className="text-[11px] text-[#6E6962]">
                        {variant.colorName_vi} • {variant.lensType_vi}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-[#1A1715]">
                      {bal.quantityOnHand}
                    </td>
                    <td className="py-3 px-4 text-center text-[#6E6962] font-medium">
                      {bal.quantityReserved}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isLow
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {bal.quantityAvailable} {isLow && "⚠️"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveModalVariantId(variant.id)}
                        className="h-8 text-xs font-medium"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1" />
                        <span>Điều Chỉnh Kho</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Điều chỉnh tồn kho */}
      {activeModalVariantId && selectedVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1A1715]/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E6E0D5] p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#F7F4EE] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1A1715]">
                  Điều Chỉnh Tồn Kho Thủ Công
                </h3>
                <span className="text-xs font-mono text-[#8C6D15]">
                  {selectedVariant.sku}
                </span>
              </div>
              <button
                onClick={() => setActiveModalVariantId(null)}
                className="p-1 text-[#6E6962] hover:text-[#1A1715]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div className="p-3 bg-[#F7F4EE] rounded-xl text-xs space-y-1">
                <div className="text-[#6E6962]">Sản phẩm: <strong className="text-[#1A1715]">{selectedVariant.productName}</strong></div>
                <div className="text-[#6E6962]">Tồn thực tế hiện tại: <strong className="text-[#1A1715]">{selectedBalance?.quantityOnHand} chiếc</strong></div>
              </div>

              {/* Loại điều chỉnh */}
              <div>
                <label className="block font-bold text-[#1A1715] mb-1.5 uppercase tracking-wider text-[11px]">
                  Loại Điều Chỉnh *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("increase")}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      adjustmentType === "increase"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-[#1A1715] border-[#E6E0D5]"
                    }`}
                  >
                    + Tăng Kho (Nhập thêm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType("decrease")}
                    className={`py-2 rounded-lg font-bold border transition-colors ${
                      adjustmentType === "decrease"
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-white text-[#1A1715] border-[#E6E0D5]"
                    }`}
                  >
                    - Giảm Kho (Xuất/Lỗi)
                  </button>
                </div>
              </div>

              {/* Số lượng */}
              <div>
                <label className="block font-bold text-[#1A1715] mb-1.5 uppercase tracking-wider text-[11px]">
                  Số Lượng Thay Đổi *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
                  className="w-full text-sm font-bold px-3 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:outline-none"
                />
              </div>

              {/* Lý do (bắt buộc cho audit) */}
              <div>
                <label className="block font-bold text-[#1A1715] mb-1.5 uppercase tracking-wider text-[11px]">
                  Lý Do Điều Chỉnh (Bắt buộc lưu vết Audit) *
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:outline-none cursor-pointer"
                >
                  <option value="REPLENISHMENT">Nhập thêm hàng mới từ xưởng sản xuất (REPLENISHMENT)</option>
                  <option value="DAMAGED_ITEM">Hàng bị lỗi / trầy xước tròng kính (DAMAGED_ITEM)</option>
                  <option value="INVENTORY_AUDIT_CORRECTION">Điều chỉnh sau kiểm kê thực tế (INVENTORY_AUDIT)</option>
                  <option value="STORE_DISPLAY_SAMPLE">Xuất làm hàng mẫu trưng bày quầy (STORE_SAMPLE)</option>
                </select>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block font-bold text-[#1A1715] mb-1.5 uppercase tracking-wider text-[11px]">
                  Ghi Chú Bổ Sung (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Ghi chú đợt kiểm tra..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#F7F4EE]">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => setActiveModalVariantId(null)}
                  className="flex-1"
                >
                  Hủy Bỏ
                </Button>
                <Button type="submit" variant="primary" size="md" className="flex-1">
                  Xác Nhận & Cập Nhật
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Đang tải kho hàng...</div>}>
      <InventoryContent />
    </Suspense>
  );
}

