import React from "react";
import { cn } from "@/lib/utils";
import { OrderStatus, PaymentStatus } from "@/types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "outline" | "gold";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#EFECE4] text-[#1A1715] border-transparent",
    gold: "bg-[#D4AF37]/20 text-[#8C6D15] border-[#D4AF37]/30 font-medium",
    success: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    destructive: "bg-red-100 text-red-800 border-red-200",
    info: "bg-sky-100 text-sky-800 border-sky-200",
    outline: "bg-transparent text-[#6E6962] border-[#E6E0D5]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const statusConfig: Record<OrderStatus, { label_vi: string; label_en: string; variant: BadgeProps["variant"] }> = {
    pending: { label_vi: "Chờ xác nhận", label_en: "Pending", variant: "warning" },
    confirmed: { label_vi: "Đã xác nhận", label_en: "Confirmed", variant: "info" },
    preparing: { label_vi: "Đang đóng gói", label_en: "Preparing", variant: "info" },
    shipped: { label_vi: "Đã gửi hàng", label_en: "Shipped", variant: "gold" },
    ready_for_pickup: { label_vi: "Chờ khách lấy", label_en: "Ready for Pickup", variant: "warning" },
    completed: { label_vi: "Hoàn tất", label_en: "Completed", variant: "success" },
    cancelled: { label_vi: "Đã hủy", label_en: "Cancelled", variant: "destructive" },
    returned: { label_vi: "Đã trả hàng", label_en: "Returned", variant: "destructive" },
  };

  const config = statusConfig[status] || { label_vi: status, label_en: status, variant: "default" };

  return <Badge variant={config.variant}>{config.label_vi}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const statusConfig: Record<PaymentStatus, { label_vi: string; label_en: string; variant: BadgeProps["variant"] }> = {
    pending: { label_vi: "Chưa thanh toán", label_en: "Unpaid", variant: "warning" },
    verified: { label_vi: "Đã xác minh tiền", label_en: "Verified", variant: "info" },
    paid: { label_vi: "Đã thanh toán", label_en: "Paid", variant: "success" },
    failed: { label_vi: "Thất bại / Hết hạn", label_en: "Failed", variant: "destructive" },
    refunded: { label_vi: "Đã hoàn tiền", label_en: "Refunded", variant: "default" },
    partially_refunded: { label_vi: "Hoàn một phần", label_en: "Partial Refund", variant: "default" },
  };

  const config = statusConfig[status] || { label_vi: status, label_en: status, variant: "default" };

  return <Badge variant={config.variant}>{config.label_vi}</Badge>;
}

