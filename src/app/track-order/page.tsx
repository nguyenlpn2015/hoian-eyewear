"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate, maskName, maskPhone, maskAddress } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import { Order } from "@/types";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Store,
  ExternalLink,
} from "lucide-react";

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") || "";
  const phoneParam = searchParams.get("phone") || "";

  const { orders, t } = useApp();

  const [orderRefInput, setOrderRefInput] = useState(refParam);
  const [phoneInput, setPhoneInput] = useState(phoneParam);
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (refParam && phoneParam) {
      handleLookup(refParam, phoneParam);
    }
  }, [refParam, phoneParam]);

  const handleLookup = (ref: string, phone: string) => {
    setErrorMessage("");
    setFoundOrder(null);

    // Rate limiting simulation (max 5 attempts)
    if (attemptCount >= 5) {
      setIsLocked(true);
      setErrorMessage(
        t(
          "Bạn đã thử tra cứu quá nhiều lần. Nhằm bảo mật đơn hàng, vui lòng thử lại sau 15 phút.",
          "Too many attempts. To protect customer privacy, please try again in 15 minutes."
        )
      );
      return;
    }

    setAttemptCount((prev) => prev + 1);

    const cleanRef = ref.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, "");

    const match = orders.find(
      (o) =>
        o.orderRef.toUpperCase() === cleanRef &&
        o.customerPhone.replace(/\D/g, "") === cleanPhone
    );

    if (match) {
      setFoundOrder(match);
    } else {
      setErrorMessage(
        t(
          "Thông tin mã đơn hàng hoặc số điện thoại không chính xác. Vui lòng kiểm tra lại tin nhắn hoặc email.",
          "No order found matching the provided reference and phone number."
        )
      );
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(orderRefInput, phoneInput);
  };

  // Timeline progress definition
  const orderSteps = [
    { key: "pending", label_vi: "Đã đặt đơn", label_en: "Order Placed" },
    { key: "confirmed", label_vi: "Đã xác nhận", label_en: "Confirmed" },
    { key: "preparing", label_vi: "Đang đóng gói", label_en: "Packing" },
    { key: "shipped", label_vi: "Đang giao hàng", label_en: "In Transit" },
    { key: "completed", label_vi: "Hoàn tất", label_en: "Delivered" },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case "pending":
        return 0;
      case "confirmed":
        return 1;
      case "preparing":
        return 2;
      case "shipped":
      case "ready_for_pickup":
        return 3;
      case "completed":
        return 4;
      default:
        return 0;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Search Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
          {t("Bảo Mật Quyền Riêng Tư Khách Hàng", "Privacy-Preserving Tracking")}
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#1A1715] font-serif">
          {t("Tra Cứu Tiến Độ Đơn Hàng", "Track Your Eyewear Order")}
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6962] max-w-lg mx-auto">
          {t(
            "Nhập Mã đơn hàng (VD: HAE-8K2M-9X4W) và Số điện thoại đã đặt mua kính để kiểm tra tiến trình bưu tá.",
            "Enter your Order Reference and registered phone number to view live fulfillment updates."
          )}
        </p>
      </div>

      {/* Lookup Form */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E6E0D5] shadow-xs max-w-2xl mx-auto space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#1A1715] mb-1">
                {t("Mã đơn hàng *", "Order Reference *")}
              </label>
              <input
                type="text"
                required
                disabled={isLocked}
                value={orderRefInput}
                onChange={(e) => setOrderRefInput(e.target.value)}
                placeholder="VD: HAE-8K2M-9X4W"
                className="w-full text-xs font-mono px-3 py-2.5 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A1715] mb-1">
                {t("Số điện thoại đặt kính *", "Phone Number *")}
              </label>
              <input
                type="tel"
                required
                disabled={isLocked}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="0905123456"
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isLocked}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-1" />
            <span>{t("Tra Cứu Tiến Độ Đơn Hàng", "Track Order")}</span>
          </Button>
        </form>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* ORDER RESULTS VIEW */}
      {foundOrder && (
        <div className="bg-white rounded-2xl border border-[#E6E0D5] shadow-md overflow-hidden space-y-6 p-6 sm:p-8">
          {/* Top Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F7F4EE] pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-[#1A1715] font-mono">
                  {foundOrder.orderRef}
                </span>
                <OrderStatusBadge status={foundOrder.orderStatus} />
                <PaymentStatusBadge status={foundOrder.paymentStatus} />
              </div>
              <p className="text-xs text-[#6E6962] mt-0.5">
                {t("Ngày đặt:", "Placed on:")} {formatDate(foundOrder.createdAt)}
              </p>
            </div>

            <div className="text-xs font-semibold text-[#8C6D15] bg-[#F7F4EE] px-3 py-1.5 rounded-lg border border-[#E6E0D5]">
              {foundOrder.fulfillmentType === "delivery"
                ? t("📦 Giao hàng tận nơi", "📦 Nationwide Delivery")
                : t("🏬 Nhận tại Boutique Hội An", "🏬 In-Store Pickup")}
            </div>
          </div>

          {/* Timeline Progress Stepper */}
          <div className="py-4 border-b border-[#F7F4EE]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E6962] mb-4">
              {t("Tiến Trình Đơn Hàng", "Fulfillment Timeline")}
            </h3>

            <div className="relative flex justify-between items-center max-w-2xl mx-auto px-4">
              {/* Connecting Line */}
              <div className="absolute top-4 left-6 right-6 h-0.5 bg-[#EFECE4] -z-0" />
              <div
                className="absolute top-4 left-6 h-0.5 bg-[#D4AF37] -z-0 transition-all duration-500"
                style={{
                  width: `${(getStepIndex(foundOrder.orderStatus) / (orderSteps.length - 1)) * 90}%`,
                }}
              />

              {orderSteps.map((step, idx) => {
                const isPassed = getStepIndex(foundOrder.orderStatus) >= idx;
                const isCurrent = getStepIndex(foundOrder.orderStatus) === idx;

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? "bg-[#D4AF37] text-[#1A1715] ring-4 ring-[#D4AF37]/20 scale-110"
                          : isPassed
                          ? "bg-[#1A1715] text-white"
                          : "bg-[#EFECE4] text-[#6E6962]"
                      }`}
                    >
                      {isPassed ? "✓" : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs mt-2 text-center max-w-[70px] ${
                        isCurrent ? "font-bold text-[#1A1715]" : "text-[#6E6962]"
                      }`}
                    >
                      {t(step.label_vi, step.label_en)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Details (If shipped) */}
          {foundOrder.shippingCarrier && (
            <div className="p-4 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-[#D4AF37] shrink-0" />
                <div>
                  <div className="font-bold text-[#1A1715]">
                    {t("Đơn vị chuyển phát:", "Courier Service:")} {foundOrder.shippingCarrier}
                  </div>
                  <div className="text-[#6E6962]">
                    {t("Mã vận đơn:", "Tracking Number:")}{" "}
                    <span className="font-mono font-bold text-[#1A1715]">
                      {foundOrder.trackingCode || "Đang cập nhật..."}
                    </span>
                  </div>
                </div>
              </div>

              {foundOrder.trackingCode && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8C6D15]">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Tra cứu trên bưu tá GHTK</span>
                </span>
              )}
            </div>
          )}

          {/* Masked Recipient Info (Zero PII leakage) */}
          <div className="p-4 bg-white rounded-xl border border-[#E6E0D5] space-y-1.5 text-xs">
            <h4 className="font-bold text-[#1A1715] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#3E5345]" />
              <span>{t("Thông Tin Người Nhận (Đã Che Mờ Bảo Mật PII)", "Masked Recipient Information")}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#6E6962] pt-1">
              <div>
                <span>{t("Người nhận:", "Recipient:")} </span>
                <span className="font-medium text-[#1A1715]">
                  {maskName(foundOrder.customerName)}
                </span>
              </div>
              <div>
                <span>{t("Số điện thoại:", "Phone:")} </span>
                <span className="font-mono font-medium text-[#1A1715]">
                  {maskPhone(foundOrder.customerPhone)}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span>{t("Địa chỉ:", "Address:")} </span>
                <span className="font-medium text-[#1A1715]">
                  {foundOrder.shippingAddress
                    ? maskAddress(foundOrder.shippingAddress.fullAddress)
                    : "123 Trần Phú, Phường Minh An, TP. Hội An"}
                </span>
              </div>
            </div>
          </div>

          {/* Items Purchased List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-[#1A1715] uppercase tracking-wider">
              {t("Kính Mát Trong Đơn", "Items In Order")}
            </h4>

            <div className="divide-y divide-[#F7F4EE] border border-[#E6E0D5] rounded-xl overflow-hidden bg-white">
              {foundOrder.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-14 bg-[#F7F4EE] rounded-md overflow-hidden shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-[#1A1715]">{item.productName}</div>
                      <div className="text-[11px] text-[#6E6962]">{item.variantDescription}</div>
                      <div className="text-[10px] font-mono text-[#8C6D15]">SKU: {item.sku}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-[#1A1715]">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </div>
                    <div className="text-[10px] text-[#6E6962]">SL: {item.quantity}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-bold text-[#1A1715] pt-2 px-1">
              <span>{t("Tổng giá trị đơn:", "Order Total:")}</span>
              <span className="text-base text-[#D4AF37]">{formatCurrency(foundOrder.totalAmount)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs">Đang tải trang tra cứu...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}
