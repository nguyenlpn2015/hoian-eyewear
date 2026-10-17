"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Order } from "@/types";
import {
  CheckCircle2,
  Copy,
  Clock,
  QrCode,
  Truck,
  ArrowRight,
  Check,
} from "lucide-react";

interface OrderConfirmedClientViewProps {
  orderRef: string;
  initialOrder: Order | null;
}

export default function OrderConfirmedClientView({
  orderRef,
  initialOrder,
}: OrderConfirmedClientViewProps) {
  const { orders, t } = useApp();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 24-hour countdown simulation
  const [timeLeft, setTimeLeft] = useState(24 * 3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (secs: number) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, "0");
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  // Ưu tiên dữ liệu thật từ Server, nếu không thì fallback từ AppContext
  const order = initialOrder || orders.find((o) => o.orderRef === orderRef) || null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const bankName = "VietinBank (Ngân hàng Công Thương Việt Nam)";
  const accountHolder = "HOI AN EYEWEAR BOUTIQUE";
  const accountNumber = "102877779999";
  const amountToTransfer = order ? order.totalAmount : 450000;
  const transferMemo = order ? order.orderRef : orderRef;

  // VietQR dynamic image URL
  const qrUrl = `https://img.vietqr.io/image/970415-${accountNumber}-compact2.png?amount=${amountToTransfer}&addInfo=${encodeURIComponent(
    transferMemo
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Success Banner */}
      <div className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E6E0D5] text-center space-y-3 shadow-xs">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1715] font-serif">
          {t("Đặt Hàng Thành Công!", "Order Placed Successfully!")}
        </h1>
        <p className="text-xs sm:text-sm text-[#6E6962] max-w-lg mx-auto">
          {t(
            `Cảm ơn bạn ${order?.customerName || ""}. Đơn kính mát của bạn đã được tiếp nhận và giữ chỗ trong kho.`,
            `Thank you ${order?.customerName || ""}. Your order has been placed and reserved in our inventory.`
          )}
        </p>

        <div className="pt-2">
          <span className="inline-block px-4 py-2 bg-[#F7F4EE] border border-[#E6E0D5] rounded-xl text-sm font-mono font-bold text-[#D4AF37] tracking-wider">
            {t("Mã Đơn Hàng:", "Order Ref:")} {transferMemo}
          </span>
        </div>
      </div>

      {/* VIETQR PAYMENT CARD (If bank transfer) */}
      {order?.paymentMethod === "bank_transfer" && (
        <div className="bg-[#F7F4EE] p-6 sm:p-8 rounded-2xl border-2 border-[#D4AF37] space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E0D5] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#1A1715] flex items-center justify-center">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#1A1715]">
                  {t("Thanh Toán Chuyển Khoản Qua VietQR", "Scan VietQR to Pay")}
                </h2>
                <p className="text-xs text-[#6E6962]">
                  {t("Quét mã qua bất kỳ ứng dụng ngân hàng nào tại Việt Nam", "Scan with any Vietnam mobile banking app")}
                </p>
              </div>
            </div>

            {/* Countdown Badge */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-[#E6E0D5] text-xs font-semibold text-[#8C6D15]">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>{t("Thời gian giữ kính:", "Holding for:")}</span>
              <span className="font-mono font-bold text-red-600">{formatCountdown(timeLeft)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* QR Canvas */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-[#E6E0D5] shadow-xs">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64">
                <Image
                  src={qrUrl}
                  alt="VietQR Code"
                  fill
                  className="object-contain"
                  sizes="260px"
                  unoptimized
                />
              </div>
              <span className="text-[11px] text-[#6E6962] mt-2 font-medium">
                {t("Mở app ngân hàng để quét mã QR", "Open banking app to scan")}
              </span>
            </div>

            {/* Copyable Details */}
            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#E6E0D5] space-y-1">
                <div className="text-[11px] text-[#6E6962]">{t("Ngân hàng nhận", "Beneficiary Bank")}</div>
                <div className="font-bold text-[#1A1715]">{bankName}</div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E6E0D5] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#6E6962]">{t("Số tài khoản", "Account Number")}</div>
                  <div className="font-mono font-bold text-sm text-[#1A1715]">{accountNumber}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(accountNumber, "accountNumber")}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F7F4EE] hover:bg-[#EFECE4] rounded-md font-semibold text-[#8C6D15] transition-colors"
                >
                  {copiedField === "accountNumber" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "accountNumber" ? t("Đã chép", "Copied") : t("Sao chép", "Copy")}</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E6E0D5] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#6E6962]">{t("Số tiền chính xác", "Amount")}</div>
                  <div className="font-bold text-base text-[#D4AF37]">{formatCurrency(amountToTransfer)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(String(amountToTransfer), "amount")}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#F7F4EE] hover:bg-[#EFECE4] rounded-md font-semibold text-[#8C6D15] transition-colors"
                >
                  {copiedField === "amount" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "amount" ? t("Đã chép", "Copied") : t("Sao chép", "Copy")}</span>
                </button>
              </div>

              <div className="p-3 bg-white rounded-xl border-2 border-[#D4AF37] flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-[#6E6962] font-semibold">
                    {t("Nội dung chuyển khoản (Bắt buộc)", "Transfer Memo (Required)")}
                  </div>
                  <div className="font-mono font-extrabold text-sm text-[#1A1715]">{transferMemo}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(transferMemo, "memo")}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#D4AF37] text-[#1A1715] hover:bg-[#BA9425] rounded-md font-bold transition-colors"
                >
                  {copiedField === "memo" ? <Check className="w-3.5 h-3.5 text-emerald-900" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "memo" ? t("Đã chép", "Copied") : t("Sao chép", "Copy")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COD INSTRUCTIONS (If cash on delivery) */}
      {order?.paymentMethod === "cod" && (
        <div className="p-6 bg-[#F7F4EE] rounded-2xl border border-[#E6E0D5] space-y-2 text-xs">
          <h3 className="font-bold text-[#1A1715] text-sm">
            {t("Hướng Dẫn Thanh Toán COD", "COD Payment Instructions")}
          </h3>
          <p className="text-[#6E6962]">
            {order.fulfillmentType === "delivery"
              ? t(
                  "Kính mát sẽ được đóng gói cẩn thận trong hộp cứng và bàn giao cho bưu tá GHTK. Bạn vui lòng chuẩn bị số tiền mặt chính xác khi nhận hàng.",
                  "Your sunglasses will be safely packed and handed to the courier. Please prepare cash upon delivery."
                )
              : t(
                  "Bạn có thể thanh toán bằng tiền mặt hoặc quẹt thẻ khi đến nhận kính tại Boutique 123 Trần Phú, Hội An.",
                  "You can pay cash or card when collecting at our Hoi An boutique."
                )}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link href={`/track-order?ref=${transferMemo}&phone=${order?.customerPhone || ""}`} className="flex-1">
          <Button variant="secondary" size="lg" className="w-full">
            <Truck className="w-4 h-4 mr-1 text-[#D4AF37]" />
            <span>{t("Tra Cứu Tiến Độ Đơn Hàng", "Track Order Progress")}</span>
          </Button>
        </Link>
        <Link href="/collections" className="flex-1">
          <Button variant="outline" size="lg" className="w-full">
            <span>{t("Tiếp Tục Mua Sắm", "Continue Shopping")}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

