"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { MOCK_PRODUCTS } from "@/data/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Banknote,
  CreditCard,
  QrCode,
  Store,
} from "lucide-react";

interface POSCartLine {
  variantId: string;
  sku: string;
  productName: string;
  variantDesc: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export default function AdminPOSPage() {
  const { t, getAvailableStock, recordInStoreSale } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [posCart, setPosCart] = useState<POSCartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "vietqr">("cash");
  const [cashReceived, setCashReceived] = useState<number | "">("");
  const [successSaleRef, setSuccessSaleRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Flatten all variants for fast POS lookup
  const allVariants = MOCK_PRODUCTS.flatMap((p) =>
    p.variants.map((v) => ({
      ...v,
      productName: p.name_vi,
      productName_en: p.name_en,
      categorySlug: p.slug,
    }))
  );

  const searchResults = allVariants.filter(
    (v) =>
      v.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.colorName_vi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = posCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const changeDue =
    typeof cashReceived === "number" && cashReceived >= cartTotal
      ? cashReceived - cartTotal
      : 0;

  const addToPOSCart = (variant: (typeof allVariants)[0]) => {
    setErrorMsg("");
    setSuccessSaleRef(null);
    const avail = getAvailableStock(variant.id);
    const existing = posCart.find((item) => item.variantId === variant.id);
    const currentQty = existing ? existing.quantity : 0;

    if (currentQty + 1 > avail) {
      setErrorMsg(`Mẫu kính ${variant.sku} chỉ còn ${avail} chiếc khả dụng.`);
      return;
    }

    if (existing) {
      setPosCart(
        posCart.map((item) =>
          item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setPosCart([
        ...posCart,
        {
          variantId: variant.id,
          sku: variant.sku,
          productName: variant.productName,
          variantDesc: `${variant.colorName_vi} / ${variant.lensType_vi}`,
          price: variant.price,
          quantity: 1,
          imageUrl: variant.imageUrl,
        },
      ]);
    }
  };

  const updatePOSQty = (variantId: string, delta: number) => {
    setErrorMsg("");
    const avail = getAvailableStock(variantId);
    const line = posCart.find((i) => i.variantId === variantId);
    if (!line) return;

    const newQty = line.quantity + delta;
    if (newQty <= 0) {
      setPosCart(posCart.filter((i) => i.variantId !== variantId));
      return;
    }
    if (newQty > avail) {
      setErrorMsg(`Chỉ còn ${avail} chiếc trong kho.`);
      return;
    }

    setPosCart(
      posCart.map((i) => (i.variantId === variantId ? { ...i, quantity: newQty } : i))
    );
  };

  const removePOSLine = (variantId: string) => {
    setPosCart(posCart.filter((i) => i.variantId !== variantId));
  };

  const handleCheckoutPOS = () => {
    if (posCart.length === 0) return;
    setErrorMsg("");

    // Execute atomic sale for all lines in cart
    let lastRef = "";
    for (const item of posCart) {
      const res = recordInStoreSale(item.variantId, item.quantity, paymentMethod);
      if (!res.success) {
        setErrorMsg(res.error || "Lỗi khi trừ kho!");
        return;
      }
      lastRef = res.orderRef || "HAE-POS-SALE";
    }

    setSuccessSaleRef(lastRef);
    setPosCart([]);
    setCashReceived("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-[#E6E0D5] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1A1715] text-[#D4AF37] flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1715] font-serif">
              {t("Bán Hàng Tại Quầy (In-Store POS-Lite)", "In-Store POS Interface")}
            </h1>
            <p className="text-xs text-[#6E6962]">
              {t("Thu ngân Boutique Hội An • Trừ tồn kho thời gian thực tức thì", "Boutique Cashier • Instant Real-Time Stock Decrement")}
            </p>
          </div>
        </div>
      </div>

      {successSaleRef && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-sm">Giao dịch thành công! Mã đơn: {successSaleRef}</span>
              <p className="text-[11px] text-emerald-700">Tồn kho đã được trừ trực tiếp trên hệ thống CSDL dùng chung.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSuccessSaleRef(null)}
            className="border-emerald-300 bg-white"
          >
            Đơn mới
          </Button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* POS GRID LAYOUT: Left product selector (7 cols), Right Cart (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Fast Product Search & Variant Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#6E6962] absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ mã SKU (ví dụ: HAE-AV01) hoặc tên kính để tìm nhanh..."
              className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-[#E6E0D5] bg-white focus:ring-2 focus:ring-[#D4AF37] focus:outline-none shadow-xs"
            />
          </div>

          {/* Variants list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {searchResults.map((variant) => {
              const avail = getAvailableStock(variant.id);
              const isOut = avail <= 0;

              return (
                <div
                  key={variant.id}
                  onClick={() => !isOut && addToPOSCart(variant)}
                  className={`p-3 bg-white rounded-xl border flex gap-3 cursor-pointer transition-all ${
                    isOut
                      ? "opacity-50 border-[#E6E0D5] cursor-not-allowed"
                      : "border-[#E6E0D5] hover:border-[#D4AF37] hover:shadow-md active:scale-98"
                  }`}
                >
                  <div className="relative w-16 h-20 bg-[#F7F4EE] rounded-lg overflow-hidden shrink-0">
                    <Image
                      src={variant.imageUrl}
                      alt={variant.productName}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between text-xs">
                    <div>
                      <div className="font-bold text-[#1A1715] line-clamp-1">
                        {variant.productName}
                      </div>
                      <div className="text-[11px] text-[#6E6962] line-clamp-1">
                        {variant.colorName_vi} • {variant.lensType_vi}
                      </div>
                      <div className="text-[10px] font-mono text-[#8C6D15] mt-0.5">
                        {variant.sku}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#F7F4EE]">
                      <span className="font-bold text-[#1A1715]">
                        {formatCurrency(variant.price)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isOut
                            ? "bg-red-100 text-red-700"
                            : avail <= 3
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {isOut ? "Hết" : `Còn ${avail}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Counter Cart & Checkout Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F7F4EE] pb-3">
              <h2 className="text-sm font-bold text-[#1A1715] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#D4AF37]" />
                <span>Đơn Tại Quầy ({posCart.length} món)</span>
              </h2>
              {posCart.length > 0 && (
                <button
                  onClick={() => setPosCart([])}
                  className="text-[11px] text-red-600 hover:underline"
                >
                  Xóa toàn bộ
                </button>
              )}
            </div>

            {/* Cart items in POS */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {posCart.length === 0 ? (
                <div className="text-center py-10 text-xs text-[#6E6962]">
                  Chọn kính bên trái để thêm vào đơn tại quầy.
                </div>
              ) : (
                posCart.map((item) => (
                  <div
                    key={item.variantId}
                    className="p-2.5 bg-[#FDFBF7] rounded-xl border border-[#E6E0D5] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-[#1A1715]">{item.productName}</div>
                      <div className="text-[10px] text-[#6E6962]">{item.variantDesc}</div>
                      <div className="font-bold text-[#D4AF37] mt-0.5">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-[#E6E0D5] rounded-md bg-white">
                        <button
                          onClick={() => updatePOSQty(item.variantId, -1)}
                          className="p-1 hover:bg-[#F7F4EE]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updatePOSQty(item.variantId, 1)}
                          className="p-1 hover:bg-[#F7F4EE]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removePOSLine(item.variantId)}
                        className="text-[#6E6962] hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment method at counter */}
            {posCart.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-[#F7F4EE]">
                <div className="text-xs font-bold text-[#1A1715] uppercase">
                  Hình Thức Thanh Toán
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 ${
                      paymentMethod === "cash"
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#1A1715]"
                        : "border-[#E6E0D5] text-[#6E6962]"
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-[#D4AF37]" />
                    <span>Tiền Mặt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("vietqr")}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 ${
                      paymentMethod === "vietqr"
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#1A1715]"
                        : "border-[#E6E0D5] text-[#6E6962]"
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-[#D4AF37]" />
                    <span>Quét VietQR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 ${
                      paymentMethod === "card"
                        ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#1A1715]"
                        : "border-[#E6E0D5] text-[#6E6962]"
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-[#D4AF37]" />
                    <span>Cà Thẻ</span>
                  </button>
                </div>

                {/* Cash Received & Change Calculator */}
                {paymentMethod === "cash" && (
                  <div className="p-3 bg-[#F7F4EE] rounded-xl space-y-2 text-xs border border-[#E6E0D5]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6E6962]">Tiền khách đưa:</span>
                      <input
                        type="number"
                        placeholder="Nhập số tiền..."
                        value={cashReceived}
                        onChange={(e) =>
                          setCashReceived(e.target.value ? Number(e.target.value) : "")
                        }
                        className="w-36 text-right px-2 py-1 bg-white border border-[#E6E0D5] rounded-md font-bold text-sm focus:outline-none"
                      />
                    </div>
                    {typeof cashReceived === "number" && (
                      <div className="flex items-center justify-between font-bold pt-1 border-t border-[#E6E0D5]">
                        <span>Tiền thối lại khách:</span>
                        <span className="text-emerald-700 text-sm">
                          {formatCurrency(changeDue)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total & Submit Button */}
                <div className="flex justify-between items-center text-sm font-bold pt-2">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-lg text-[#D4AF37] font-extrabold">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleCheckoutPOS}
                  className="w-full text-sm font-bold shadow-md"
                >
                  <span>Hoàn Tất Bán Hàng & Trừ Kho Ngay</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

