"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { VIETNAM_PROVINCES } from "@/data/mock-data";
import {
  Truck,
  Store,
  ShieldCheck,
  QrCode,
  Banknote,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

export default function CheckoutPage() {
  const { cart, cartTotal, createOnlineOrder, t } = useApp();
  const router = useRouter();

  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bank_transfer">("bank_transfer");

  // Form states
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("DANANG");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [street, setStreet] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If cart is empty
  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-[#1A1715]">
          {t("Giỏ hàng của bạn đang trống", "Your cart is empty")}
        </h1>
        <p className="text-xs text-[#6E6962]">
          {t("Vui lòng chọn kính mát trước khi tiến hành thanh toán.", "Please add items to cart before checkout.")}
        </p>
        <Link href="/collections">
          <Button variant="primary" size="md">
            {t("Xem bộ sưu tập kính", "View Collection")}
          </Button>
        </Link>
      </div>
    );
  }

  // Shipping Fee Logic
  const freeShippingThreshold = 500000;
  let shippingFee = 0;
  if (fulfillmentType === "delivery") {
    if (cartTotal < freeShippingThreshold) {
      const prov = VIETNAM_PROVINCES.find((p) => p.code === selectedProvince);
      shippingFee = prov?.zone === 1 ? 20000 : 35000;
    }
  }

  const finalTotal = cartTotal + shippingFee;

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Form validations
    if (!customerName.trim()) {
      setErrorMsg(t("Vui lòng nhập họ và tên người nhận.", "Please enter full name."));
      return;
    }

    // Phone validation regex for VN mobile
    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (!/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone)) {
      setErrorMsg(
        t(
          "Vui lòng nhập số điện thoại hợp lệ 10 chữ số (Ví dụ: 0905123456).",
          "Please enter a valid 10-digit mobile number."
        )
      );
      return;
    }

    if (fulfillmentType === "delivery") {
      if (!district.trim() || !ward.trim() || !street.trim()) {
        setErrorMsg(
          t(
            "Vui lòng điền đầy đủ thông tin địa chỉ giao hàng (Quận/Huyện, Phường/Xã, Số nhà).",
            "Please provide full delivery address details."
          )
        );
        return;
      }
    }

    setIsSubmitting(true);

    const provObj = VIETNAM_PROVINCES.find((p) => p.code === selectedProvince);
    const fullAddress =
      fulfillmentType === "delivery"
        ? `${street.trim()}, ${ward.trim()}, ${district.trim()}, ${provObj?.name || "Việt Nam"}`
        : "123 Trần Phú, Phường Minh An, TP. Hội An, Quảng Nam";

    const res = createOnlineOrder({
      fulfillmentType,
      paymentMethod,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerEmail: customerEmail.trim() || undefined,
      shippingAddress: {
        province: provObj?.name || "Đà Nẵng",
        district: district.trim(),
        ward: ward.trim(),
        street: street.trim(),
        fullAddress,
      },
      shippingFee,
      customerNotes: notes.trim() || undefined,
    });

    if (res.success && res.orderRef) {
      router.push(`/order-confirmed/${res.orderRef}`);
    } else {
      setIsSubmitting(false);
      setErrorMsg(res.error || t("Đặt hàng thất bại. Vui lòng thử lại.", "Order failed. Please try again."));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="border-b border-[#E6E0D5] pb-4 flex items-center justify-between">
        <div>
          <Link
            href="/cart"
            className="text-xs font-semibold text-[#8C6D15] hover:text-[#1A1715] flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("Quay lại giỏ hàng", "Back to Cart")}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1715] font-serif">
            {t("Đặt Hàng (Thanh Toán Khách Vãng Lai)", "Guest Checkout")}
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Customer info & delivery (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Fulfillment Type Toggle */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1A1715]">
              {t("1. Phương Thức Nhận Kính", "1. Delivery or Pickup")}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType("delivery")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  fulfillmentType === "delivery"
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#FDFBF7]"
                    : "border-[#E6E0D5] hover:bg-[#F7F4EE]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#1A1715]">
                    {t("Giao Hàng Tận Nơi", "Nationwide Delivery")}
                  </span>
                </div>
                <p className="text-[11px] text-[#6E6962]">
                  {t("Giao tận nhà toàn quốc (1-3 ngày)", "Door-to-door (1-3 days)")}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType("pickup")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  fulfillmentType === "pickup"
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#FDFBF7]"
                    : "border-[#E6E0D5] hover:bg-[#F7F4EE]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-bold text-[#1A1715]">
                    {t("Nhận Tại Cửa Hàng", "Store Pickup")}
                  </span>
                </div>
                <p className="text-[11px] text-[#6E6962]">
                  {t("123 Trần Phú, Hội An (0 ₫)", "Free pickup at boutique")}
                </p>
              </button>
            </div>

            {fulfillmentType === "pickup" && (
              <div className="p-3 bg-[#F7F4EE] rounded-xl border border-[#E6E0D5] text-xs text-[#1A1715] flex items-start gap-2.5">
                <Store className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Boutique Hoi An Eyewear:</span> 123 Trần Phú, Phường Minh An, TP. Hội An, Quảng Nam.
                  <div className="text-[11px] text-[#6E6962] mt-0.5">
                    {t("Mở cửa: 08:30 – 21:30 hàng ngày. Đơn sẽ sẵn sàng trong 1 giờ.", "Open 08:30 - 21:30 daily. Ready in 1 hour.")}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Customer Contact & Address Form */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1A1715]">
              {t("2. Thông Tin Khách Hàng", "2. Customer & Address")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1A1715] mb-1">
                  {t("Họ và tên *", "Full Name *")}
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1A1715] mb-1">
                  {t("Số điện thoại (10 số) *", "Phone Number *")}
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0905123456"
                  className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1">
                {t("Email (Tùy chọn nhận xác nhận)", "Email (Optional for receipt)")}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="an.nguyen@example.com"
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>

            {/* Vietnam 4-Level Administrative Address */}
            {fulfillmentType === "delivery" && (
              <div className="space-y-4 pt-3 border-t border-[#F7F4EE]">
                <div className="text-xs font-bold text-[#1A1715] uppercase">
                  {t("Địa Chỉ Nhận Hàng (Việt Nam)", "Delivery Address")}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6962] mb-1">
                      {t("Tỉnh / Thành phố *", "Province/City *")}
                    </label>
                    <select
                      value={selectedProvince}
                      onChange={(e) => setSelectedProvince(e.target.value)}
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none cursor-pointer"
                    >
                      {VIETNAM_PROVINCES.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6962] mb-1">
                      {t("Quận / Huyện *", "District *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Quận Hải Châu"
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#6E6962] mb-1">
                      {t("Phường / Xã *", "Ward *")}
                    </label>
                    <input
                      type="text"
                      required
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      placeholder="Phường Thạch Thang"
                      className="w-full text-xs px-2.5 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#6E6962] mb-1">
                    {t("Số nhà, tên đường cụ thể *", "Street Address *")}
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="123 Quang Trung"
                    className="w-full text-xs px-3 py-2.5 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#1A1715] mb-1">
                {t("Ghi chú đơn hàng (Tùy chọn)", "Order Notes (Optional)")}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
                className="w-full text-xs px-3 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:ring-1 focus:ring-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Payment Method Selection */}
          <div className="bg-white p-5 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1A1715]">
              {t("3. Hình Thức Thanh Toán", "3. Payment Method")}
            </h2>

            <div className="space-y-3">
              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === "bank_transfer"
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#FDFBF7]"
                    : "border-[#E6E0D5] hover:bg-[#F7F4EE]"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={() => setPaymentMethod("bank_transfer")}
                  className="accent-[#D4AF37] mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#1A1715]">
                      {t("Chuyển Khoản Ngân Hàng (Quét VietQR)", "Bank Transfer (VietQR)")}
                    </span>
                    <span className="text-[10px] bg-[#D4AF37]/20 text-[#8C6D15] px-2 py-0.5 rounded-full font-bold">
                      {t("Khuyên dùng", "Recommended")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6962] mt-0.5">
                    {t(
                      "Mã VietQR động tạo tức thì sau khi đặt. Giữ kính trong 24 giờ chờ xác nhận.",
                      "Instant VietQR generated on confirmation. 24h stock hold guaranteed."
                    )}
                  </p>
                </div>
              </label>

              <label
                className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                  paymentMethod === "cod"
                    ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30 bg-[#FDFBF7]"
                    : "border-[#E6E0D5] hover:bg-[#F7F4EE]"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="accent-[#D4AF37] mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#1A1715]">
                      {t("Thanh Toán Khi Nhận Kính (COD / Tiền mặt)", "Cash on Delivery (COD)")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6962] mt-0.5">
                    {t(
                      "Kiểm tra kính mát và thanh toán tiền mặt cho bưu tá hoặc tại quầy Hội An.",
                      "Inspect sunglasses and pay cash to courier upon arrival."
                    )}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Confirmation Button (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E6E0D5] shadow-xs space-y-5 sticky top-24">
            <h2 className="text-base font-bold text-[#1A1715] font-serif border-b border-[#F7F4EE] pb-3">
              {t("Đơn Hàng Của Bạn", "Your Order")} ({cart.length})
            </h2>

            {/* Mini items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.variantId} className="flex gap-3 text-xs">
                  <div className="relative w-12 h-14 bg-[#F7F4EE] rounded-md overflow-hidden shrink-0">
                    <Image
                      src={item.imageUrl}
                      alt={item.productName_vi}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="font-bold text-[#1A1715] line-clamp-1">
                        {t(item.productName_vi, item.productName_en)}
                      </div>
                      <div className="text-[11px] text-[#6E6962]">
                        {t(item.colorName_vi, item.colorName_en)} • {item.quantity} x {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div className="font-semibold text-[#1A1715] text-right">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-3 border-t border-[#F7F4EE] text-xs sm:text-sm">
              <div className="flex justify-between text-[#6E6962]">
                <span>{t("Tiền kính", "Merchandise Subtotal")}</span>
                <span className="font-medium text-[#1A1715]">{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-[#6E6962]">
                <span>{t("Phí vận chuyển", "Shipping Fee")}</span>
                <span className="font-medium text-[#1A1715]">
                  {shippingFee === 0 ? (
                    <span className="text-[#3E5345] font-bold">{t("Miễn phí 0 ₫", "Free 0 ₫")}</span>
                  ) : (
                    formatCurrency(shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#1A1715] pt-3 border-t border-[#E6E0D5]">
                <span>{t("Tổng thanh toán", "Final Amount")}</span>
                <span className="text-[#D4AF37]">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="w-full text-base font-bold shadow-md"
              >
                <span>{t("Xác Nhận Đặt Hàng Ngay", "Place Order Now")}</span>
              </Button>
            </div>

            <div className="space-y-2 text-[11px] text-[#6E6962] pt-2 border-t border-[#F7F4EE]">
              <div className="flex items-center gap-1.5 text-[#3E5345]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t("Cam kết 100% tròng kính chống tia UV quang học", "100% Certified UV Protection Guaranteed")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#3E5345]" />
                <span>{t("Hộp da bảo vệ kính + Khăn lau microfiber đi kèm", "Includes protective travel case & cloth")}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

