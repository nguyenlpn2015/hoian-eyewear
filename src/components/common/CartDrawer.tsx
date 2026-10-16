"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const {
    cart,
    cartTotal,
    cartCount,
    cartDrawerOpen,
    setCartDrawerOpen,
    updateCartQty,
    removeFromCart,
    t,
  } = useApp();

  if (!cartDrawerOpen) return null;

  const freeShippingThreshold = 500000;
  const isFreeShipping = cartTotal >= freeShippingThreshold;
  const amountToFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setCartDrawerOpen(false)}
        className="absolute inset-0 bg-[#1A1715]/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FDFBF7] shadow-2xl flex flex-col border-l border-[#E6E0D5]">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-[#E6E0D5] flex items-center justify-between bg-[#F7F4EE]">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1A1715] font-serif">
                {t("Giỏ Hàng Của Bạn", "Your Shopping Bag")}
              </h2>
              <span className="text-xs bg-[#D4AF37]/20 text-[#8C6D15] px-2 py-0.5 rounded-full font-bold">
                {cartCount}
              </span>
            </div>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="p-1.5 text-[#6E6962] hover:text-[#1A1715] hover:bg-[#EFECE4] rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress */}
          <div className="px-4 sm:px-6 py-3 bg-[#FDFBF7] border-b border-[#E6E0D5]">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-1 text-[#1A1715]">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                {isFreeShipping
                  ? t("Chúc mừng! Bạn được MIỄN PHÍ VẬN CHUYỂN", "Congratulations! You get FREE SHIPPING")
                  : t(`Mua thêm ${formatCurrency(amountToFreeShipping)} để được Freeship`, `Add ${formatCurrency(amountToFreeShipping)} for Free Shipping`)}
              </span>
              <span className="font-bold text-[#D4AF37]">
                {Math.min(100, Math.round((cartTotal / freeShippingThreshold) * 100))}%
              </span>
            </div>
            <div className="w-full bg-[#EFECE4] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#D4AF37] h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.min(100, (cartTotal / freeShippingThreshold) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-[#F7F4EE] rounded-full flex items-center justify-center mb-4 text-[#D4AF37]">
                  👓
                </div>
                <p className="text-base font-semibold text-[#1A1715] mb-1">
                  {t("Hộp kính của bạn đang trống", "Your eyewear case is empty")}
                </p>
                <p className="text-xs text-[#6E6962] max-w-xs mb-6">
                  {t(
                    "Hãy khám phá các mẫu kính mát thời trang phố cổ Hội An vừa cập bến.",
                    "Explore our handcrafted sunglasses collection inspired by ancient town aesthetics."
                  )}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setCartDrawerOpen(false)}
                >
                  <Link href="/collections">
                    {t("Khám phá bộ sưu tập", "Explore Sunglasses")}
                  </Link>
                </Button>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-4 p-3 bg-white rounded-lg border border-[#E6E0D5] shadow-xs"
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-24 bg-[#F7F4EE] rounded-md overflow-hidden shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName_vi}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="text-sm font-semibold text-[#1A1715] line-clamp-1">
                          {t(item.productName_vi, item.productName_en)}
                        </h3>
                        <button
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-[#6E6962] hover:text-red-600 transition-colors p-0.5"
                          title="Xóa sản phẩm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-xs text-[#6E6962] mt-0.5 flex flex-wrap gap-1 items-center">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block border border-black/10"
                          style={{ backgroundColor: item.colorHex }}
                        />
                        <span>{t(item.colorName_vi, item.colorName_en)}</span>
                        <span>•</span>
                        <span>{t(item.lensType_vi, item.lensType_en)}</span>
                      </div>
                      <div className="text-[10px] text-[#6E6962] font-mono mt-0.5">
                        SKU: {item.sku}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F7F4EE]">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-[#E6E0D5] rounded-md bg-[#F7F4EE]">
                        <button
                          onClick={() => updateCartQty(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-[#EFECE4] text-[#1A1715] transition-colors rounded-l-md"
                          aria-label="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-[#1A1715]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-[#EFECE4] text-[#1A1715] transition-colors rounded-r-md"
                          aria-label="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-sm font-bold text-[#1A1715]">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 bg-[#F7F4EE] border-t border-[#E6E0D5] space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-[#6E6962]">
                  <span>{t("Tạm tính", "Subtotal")}</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-[#6E6962]">
                  <span>{t("Vận chuyển", "Shipping")}</span>
                  <span className="text-[#3E5345] font-medium">
                    {isFreeShipping ? t("Miễn phí", "Free") : t("Tính lúc thanh toán", "Calculated at checkout")}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1A1715] pt-2 border-t border-[#E6E0D5]">
                  <span>{t("Tổng cộng", "Total Amount")}</span>
                  <span className="text-[#1A1715]">{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  onClick={() => setCartDrawerOpen(false)}
                  className="w-full block"
                >
                  <Button variant="primary" size="lg" className="w-full">
                    <span>{t("Tiến hành đặt hàng", "Proceed to Checkout")}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2 text-[11px] text-[#6E6962] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3E5345]" />
                <span>{t("Đổi trả trong 7 ngày • Hộp cứng cao cấp kèm khăn lau", "7-day exchange • Premium hard case included")}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
