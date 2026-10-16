"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function CartPage() {
  const { cart, cartTotal, updateCartQty, removeFromCart, t } = useApp();

  const freeShippingThreshold = 500000;
  const isFreeShipping = cartTotal >= freeShippingThreshold;

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-[#F7F4EE] rounded-full flex items-center justify-center mx-auto text-3xl">
          🕶️
        </div>
        <h1 className="text-2xl font-bold text-[#1A1715] font-serif">
          {t("Giỏ hàng của bạn đang trống", "Your shopping bag is empty")}
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6962] max-w-sm mx-auto">
          {t(
            "Chưa có mẫu kính mát nào trong giỏ. Hãy xem qua các sản phẩm nổi bật của chúng tôi.",
            "You haven't added any sunglasses yet. Explore our handcrafted collection."
          )}
        </p>
        <Link href="/collections" className="inline-block pt-2">
          <Button variant="primary" size="md">
            {t("Khám phá kính mát ngay", "Shop Sunglasses Now")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[#E6E0D5] pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1715] font-serif">
          {t("Giỏ Hàng Của Bạn", "Shopping Bag")} ({cart.length})
        </h1>
        <Link
          href="/collections"
          className="text-xs font-semibold text-[#8C6D15] hover:text-[#1A1715] flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("Tiếp tục mua sắm", "Continue Shopping")}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 p-4 bg-white rounded-xl border border-[#E6E0D5] shadow-xs"
            >
              <div className="relative w-24 h-28 bg-[#F7F4EE] rounded-lg overflow-hidden shrink-0">
                <Image
                  src={item.imageUrl}
                  alt={item.productName_vi}
                  fill
                  className="object-cover"
                  sizes="100px"
                />
              </div>

              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm sm:text-base font-bold text-[#1A1715]">
                      {t(item.productName_vi, item.productName_en)}
                    </h3>
                    <button
                      onClick={() => removeFromCart(item.variantId)}
                      className="text-[#6E6962] hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-[#6E6962] mt-1 flex flex-wrap gap-2 items-center">
                    <span
                      className="w-3 h-3 rounded-full border border-black/10 inline-block"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span>{t(item.colorName_vi, item.colorName_en)}</span>
                    <span>•</span>
                    <span>{item.sizeLabel}</span>
                    <span>•</span>
                    <span>{t(item.lensType_vi, item.lensType_en)}</span>
                  </div>
                  <div className="text-[11px] font-mono text-[#8C6D15] mt-1">
                    SKU: {item.sku}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F7F4EE]">
                  <div className="flex items-center border border-[#E6E0D5] rounded-md bg-[#F7F4EE]">
                    <button
                      onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                      className="p-1.5 hover:bg-[#EFECE4] text-[#1A1715]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-[#1A1715]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                      className="p-1.5 hover:bg-[#EFECE4] text-[#1A1715]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-base font-bold text-[#1A1715]">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-4 h-fit">
          <h2 className="text-base font-bold text-[#1A1715] font-serif border-b border-[#F7F4EE] pb-3">
            {t("Tóm Tắt Đơn Hàng", "Order Summary")}
          </h2>

          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between text-[#6E6962]">
              <span>{t("Tiền hàng", "Subtotal")}</span>
              <span className="font-medium text-[#1A1715]">{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between text-[#6E6962]">
              <span>{t("Vận chuyển", "Shipping")}</span>
              <span className="text-[#3E5345] font-medium">
                {isFreeShipping ? t("Miễn phí toàn quốc", "Free Nationwide") : t("Tính tại checkout", "At checkout")}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-[#1A1715] pt-3 border-t border-[#E6E0D5]">
              <span>{t("Tổng cộng", "Total")}</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link href="/checkout" className="block w-full">
              <Button variant="primary" size="lg" className="w-full">
                <span>{t("Tiến hành đặt hàng", "Proceed to Checkout")}</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#6E6962] pt-2">
            <ShieldCheck className="w-4 h-4 text-[#3E5345] shrink-0" />
            <span>{t("Bảo hành 1 đổi 1 trong 7 ngày nếu lỗi sản xuất", "7-day warranty exchange")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
