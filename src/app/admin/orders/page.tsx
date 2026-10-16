"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useApp } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Order } from "@/types";
import {
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Store,
  Globe,
  Phone,
  MapPin,
  X,
} from "lucide-react";

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus, updatePaymentStatus, t } = useApp();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Fulfillment form states
  const [carrierName, setCarrierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  const filteredOrders = orders.filter((ord) => {
    const matchesSearch =
      ord.orderRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ord.customerPhone.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || ord.orderStatus === statusFilter;

    const matchesChannel =
      channelFilter === "all" || ord.channel === channelFilter;

    return matchesSearch && matchesStatus && matchesChannel;
  });

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setCarrierName(order.shippingCarrier || "GHTK");
    setTrackingCode(order.trackingCode || "");
  };

  const handleVerifyPayment = (orderId: string) => {
    if (
      confirm(
        t(
          "Xác nhận đã nhận đủ tiền chuyển khoản cho đơn hàng này?",
          "Confirm bank transfer payment received for this order?"
        )
      )
    ) {
      updatePaymentStatus(orderId, "verified");
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          paymentStatus: "verified",
          orderStatus:
            selectedOrder.orderStatus === "pending"
              ? "confirmed"
              : selectedOrder.orderStatus,
        });
      }
    }
  };

  const handleShipOrder = (orderId: string) => {
    if (!trackingCode.trim()) {
      alert(
        t(
          "Vui lòng nhập mã vận đơn trước khi xác nhận gửi hàng.",
          "Please enter a tracking number before marking shipped."
        )
      );
      return;
    }
    updateOrderStatus(orderId, "shipped");
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        orderStatus: "shipped",
        shippingCarrier: carrierName,
        trackingCode: trackingCode.trim(),
      });
    }
    alert(
      t(
        `Đã cập nhật đơn hàng thành Đang giao hàng với mã ${trackingCode}!`,
        `Order marked as shipped with tracking code ${trackingCode}!`
      )
    );
  };

  const handleReadyForPickup = (orderId: string) => {
    updateOrderStatus(orderId, "ready_for_pickup");
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        orderStatus: "ready_for_pickup",
      });
    }
    alert(
      t(
        "Đã đánh dấu sẵn sàng để khách đến nhận tại boutique!",
        "Marked as ready for pickup at the boutique!"
      )
    );
  };

  const handleCompleteOrder = (orderId: string) => {
    updateOrderStatus(orderId, "completed");
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({
        ...selectedOrder,
        orderStatus: "completed",
      });
    }
    alert(t("Đơn hàng đã hoàn tất thành công!", "Order completed successfully!"));
  };

  const handleCancelOrder = (orderId: string) => {
    if (
      confirm(
        t(
          "Bạn có chắc muốn hủy đơn hàng này? Tồn kho đã giữ sẽ được tự động hoàn lại.",
          "Are you sure you want to cancel this order? Reserved stock will be released."
        )
      )
    ) {
      updateOrderStatus(orderId, "cancelled");
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({
          ...selectedOrder,
          orderStatus: "cancelled",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1715]">
            {t("Quản Lý & Xử Lý Đơn Hàng", "Order Fulfillment & Management")}
          </h1>
          <p className="text-xs text-[#6E6962] mt-0.5">
            {t(
              "Theo dõi trạng thái đơn hàng, đối soát thanh toán chuyển khoản và điều phối giao hàng",
              "Track order status, verify bank transfers, and coordinate fulfillment"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6E6962] font-mono">
            {t("Tổng cộng", "Total")}: <strong>{orders.length}</strong> {t("đơn", "orders")}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E6E0D5] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C827A] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t(
                "Tìm theo mã đơn (HAE-...), tên khách, số điện thoại...",
                "Search by order ref (HAE-...), name, phone..."
              )}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:bg-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-[#8C827A] shrink-0" />
            {[
              { id: "all", label: t("Tất cả", "All") },
              { id: "pending", label: t("Chờ xử lý", "Pending") },
              { id: "confirmed", label: t("Đã xác nhận", "Confirmed") },
              { id: "ready_for_pickup", label: t("Sẵn sàng nhận", "Ready Pickup") },
              { id: "shipped", label: t("Đang giao", "Shipped") },
              { id: "completed", label: t("Hoàn tất", "Completed") },
              { id: "cancelled", label: t("Đã hủy", "Cancelled") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? "bg-[#1A1715] text-white"
                    : "bg-[#F7F4EE] text-[#6E6962] hover:bg-[#E6E0D5]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Channel selector */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] font-medium"
          >
            <option value="all">{t("Mọi kênh bán", "All Channels")}</option>
            <option value="online">{t("Chỉ Online", "Online Only")}</option>
            <option value="in_store">{t("Chỉ Tại quầy (POS)", "In-Store Only")}</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E6E0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F4EE] border-b border-[#E6E0D5] text-[#6E6962] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">{t("Mã Đơn / Kênh", "Order Ref / Channel")}</th>
                <th className="py-3 px-4">{t("Khách Hàng", "Customer")}</th>
                <th className="py-3 px-4">{t("Sản Phẩm & SL", "Items & Qty")}</th>
                <th className="py-3 px-4">{t("Tổng Tiền", "Total")}</th>
                <th className="py-3 px-4">{t("Thanh Toán", "Payment")}</th>
                <th className="py-3 px-4">{t("Trạng Thái Đơn", "Order Status")}</th>
                <th className="py-3 px-4 text-right">{t("Hành Động", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C827A]">
                    {t("Không tìm thấy đơn hàng nào phù hợp bộ lọc.", "No orders match the filter.")}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const totalItems = ord.items.reduce((s, it) => s + it.quantity, 0);

                  return (
                    <tr key={ord.id} className="hover:bg-[#FDFBF7] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-[#1A1715]">
                          {ord.orderRef}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {ord.channel === "in_store" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                              <Store className="w-3 h-3" />
                              POS Boutique
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded font-medium">
                              <Globe className="w-3 h-3" />
                              Online
                            </span>
                          )}
                          <span className="text-[10px] text-[#8C827A]">
                            {formatDate(ord.createdAt)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#1A1715]">
                          {ord.customerName}
                        </div>
                        <div className="text-[#6E6962] text-[11px] font-mono">
                          {ord.customerPhone}
                        </div>
                        {ord.fulfillmentType === "pickup" ? (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                            {t("Nhận tại quầy", "Store pickup")}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 block truncate max-w-[150px]">
                            {ord.shippingAddress?.province}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1A1715]">
                          {totalItems} {t("món", "items")}
                        </div>
                        <div className="text-[11px] text-[#8C827A] truncate max-w-[180px]">
                          {ord.items.map((it) => it.productName).join(", ")}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[#1A1715]">
                          {formatCurrency(ord.totalAmount)}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <PaymentStatusBadge status={ord.paymentStatus} />
                          <span className="text-[10px] text-[#8C827A] uppercase">
                            {ord.paymentMethod === "bank_transfer" ? "VietQR / Bank" : "COD / Tiền mặt"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <OrderStatusBadge status={ord.orderStatus} />
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(ord)}
                          className="text-xs py-1 px-2.5 h-auto"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          {t("Chi Tiết", "Details")}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-[#E6E0D5] shadow-2xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="bg-[#1A1715] text-[#FDFBF7] p-4 sm:p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg font-bold text-[#D4AF37]">
                    {t("Đơn hàng", "Order")}: {selectedOrder.orderRef}
                  </span>
                  <span className="text-xs bg-[#2C2623] text-gray-300 px-2 py-0.5 rounded font-mono">
                    {selectedOrder.channel === "in_store" ? "Boutique POS" : "Online Store"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {t("Thời gian đặt:", "Placed at:")} {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Order Status Banners */}
              <div className="grid grid-cols-2 gap-4 bg-[#F7F4EE] p-4 rounded-xl border border-[#E6E0D5]">
                <div>
                  <span className="text-[11px] font-semibold text-[#8C827A] uppercase block mb-1">
                    {t("Trạng Thái Đơn Hàng", "Order Status")}
                  </span>
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8C827A] uppercase block mb-1">
                    {t("Trạng Thái Thanh Toán", "Payment Status")}
                  </span>
                  <PaymentStatusBadge status={selectedOrder.paymentStatus} />
                </div>
              </div>

              {/* Customer and Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Customer Info */}
                <div className="space-y-2 border border-[#E6E0D5] p-3.5 rounded-xl">
                  <h3 className="font-bold text-sm text-[#1A1715] flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-[#D4AF37]" />
                    {t("Thông Tin Khách Hàng", "Customer Information")}
                  </h3>
                  <div>
                    <span className="text-[#6E6962]">{t("Tên:", "Name:")} </span>
                    <strong className="text-[#1A1715]">{selectedOrder.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[#6E6962]">{t("Điện thoại:", "Phone:")} </span>
                    <strong className="text-[#1A1715] font-mono">{selectedOrder.customerPhone}</strong>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div>
                      <span className="text-[#6E6962]">{t("Email:", "Email:")} </span>
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                </div>

                {/* Fulfillment Info */}
                <div className="space-y-2 border border-[#E6E0D5] p-3.5 rounded-xl">
                  <h3 className="font-bold text-sm text-[#1A1715] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    {t("Phương Thức Nhận Hàng", "Fulfillment Method")}
                  </h3>
                  <div>
                    <span className="text-[#6E6962]">{t("Hình thức:", "Method:")} </span>
                    <strong className="text-[#1A1715]">
                      {selectedOrder.fulfillmentType === "pickup"
                        ? t("Nhận tại quầy boutique Hội An", "Pickup at Hoi An Boutique")
                        : t("Giao hàng tận nơi", "Home Delivery")}
                    </strong>
                  </div>
                  {selectedOrder.fulfillmentType === "delivery" && selectedOrder.shippingAddress && (
                    <div className="text-[#6E6962] leading-relaxed">
                      {selectedOrder.shippingAddress.fullAddress ||
                        `${selectedOrder.shippingAddress.street}, ${selectedOrder.shippingAddress.ward}, ${selectedOrder.shippingAddress.district}, ${selectedOrder.shippingAddress.province}`}
                    </div>
                  )}
                  {selectedOrder.trackingCode && (
                    <div className="pt-1 text-[#2C5234] font-medium">
                      {t("Đơn vị vận chuyển:", "Courier:")} {selectedOrder.shippingCarrier} — {t("Mã:", "Code:")}{" "}
                      <span className="font-mono font-bold">{selectedOrder.trackingCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-bold text-sm text-[#1A1715] mb-3">
                  {t("Danh Sách Sản Phẩm Trong Đơn", "Order Items")}
                </h3>
                <div className="border border-[#E6E0D5] rounded-xl divide-y divide-[#E6E0D5] overflow-hidden">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id || item.variantId} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-14 rounded bg-[#F7F4EE] overflow-hidden shrink-0">
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-[#1A1715]">{item.productName}</div>
                          <div className="text-[11px] text-[#6E6962]">
                            {item.variantDescription}
                          </div>
                          <div className="text-[10px] text-[#8C827A] font-mono">
                            SKU: {item.sku}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-[#6E6962]">
                          {formatCurrency(item.unitPrice)} × {item.quantity}
                        </div>
                        <div className="font-bold text-sm text-[#1A1715]">
                          {formatCurrency(item.totalPrice)}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="p-3 bg-[#FDFBF7] flex justify-between items-center text-xs">
                    <span className="text-[#6E6962]">{t("Phí vận chuyển:", "Shipping fee:")}</span>
                    <span className="font-medium">
                      {selectedOrder.shippingFee === 0
                        ? t("Miễn phí (Free)", "Free")
                        : formatCurrency(selectedOrder.shippingFee)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F4EE] flex justify-between items-center text-sm font-bold">
                    <span className="text-[#1A1715]">{t("Tổng thanh toán:", "Total Amount:")}</span>
                    <span className="text-base text-[#1A1715]">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fulfillment Actions Box */}
              <div className="border border-[#D4AF37]/40 bg-[#D4AF37]/5 p-4 rounded-xl space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#1A1715] flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-[#D4AF37]" />
                  {t("Thao Tác Xử Lý Đơn Hàng (Staff Actions)", "Fulfillment Actions")}
                </h4>

                <div className="space-y-3">
                  {/* Action 1: Verify Bank Transfer Payment */}
                  {selectedOrder.paymentMethod === "bank_transfer" &&
                    selectedOrder.paymentStatus === "pending" && (
                      <div className="p-3 bg-white rounded-lg border border-amber-300 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-amber-900">
                            {t("Chờ Xác Minh Chuyển Khoản", "Awaiting Bank Transfer Verification")}
                          </div>
                          <div className="text-[11px] text-amber-700">
                            {t(
                              "Khách đã đặt qua VietQR. Vui lòng kiểm tra sao kê ngân hàng trước khi xác nhận.",
                              "Customer ordered via VietQR. Check bank statement before confirming."
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleVerifyPayment(selectedOrder.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-3"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          {t("Xác Nhận Đã Nhận Tiền", "Verify Payment")}
                        </Button>
                      </div>
                    )}

                  {/* Action 2: Shipping for online delivery */}
                  {selectedOrder.fulfillmentType === "delivery" &&
                    selectedOrder.orderStatus === "confirmed" && (
                      <div className="p-3 bg-white rounded-lg border border-[#E6E0D5] space-y-2">
                        <div className="font-bold text-xs text-[#1A1715]">
                          {t("Gửi hàng qua đơn vị vận chuyển (GHTK / Viettel Post)", "Dispatch via Courier")}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder={t("Đơn vị vận chuyển (VD: GHTK)", "Courier (e.g. GHTK)")}
                            value={carrierName}
                            onChange={(e) => setCarrierName(e.target.value)}
                            className="text-xs p-2 rounded border border-[#E6E0D5]"
                          />
                          <input
                            type="text"
                            placeholder={t("Mã vận đơn (VD: S218931.MN1.88)", "Tracking Code (e.g. S218931.MN1.88)")}
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="text-xs p-2 rounded border border-[#E6E0D5] font-mono"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleShipOrder(selectedOrder.id)}
                          className="w-full bg-[#1A1715] text-white"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" />
                          {t("Xác Nhận Đã Gửi Hàng Cho Shipper", "Mark as Shipped")}
                        </Button>
                      </div>
                    )}

                  {/* Action 3: Ready for pickup */}
                  {selectedOrder.fulfillmentType === "pickup" &&
                    selectedOrder.orderStatus === "confirmed" && (
                      <div className="p-3 bg-white rounded-lg border border-[#E6E0D5] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-[#1A1715]">
                            {t("Hàng đã sẵn sàng tại boutique?", "Glasses ready at boutique counter?")}
                          </div>
                          <div className="text-[11px] text-[#6E6962]">
                            {t("Thông báo cho khách hàng đến quầy nhận kính.", "Notify customer ready for pickup.")}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleReadyForPickup(selectedOrder.id)}
                          className="bg-[#2C5234] text-white shrink-0 ml-3"
                        >
                          <PackageCheck className="w-3.5 h-3.5 mr-1" />
                          {t("Báo Sẵn Sàng Nhận", "Ready for Pickup")}
                        </Button>
                      </div>
                    )}

                  {/* Action 4: Complete order */}
                  {(selectedOrder.orderStatus === "shipped" ||
                    selectedOrder.orderStatus === "ready_for_pickup") && (
                    <div className="p-3 bg-white rounded-lg border border-emerald-300 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-emerald-900">
                          {t("Xác nhận hoàn tất đơn hàng", "Confirm order completed")}
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          {t(
                            "Khách đã nhận được hàng và thanh toán đủ.",
                            "Customer received goods and payment is completed."
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCompleteOrder(selectedOrder.id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 ml-3"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {t("Đánh Dấu Hoàn Tất", "Mark Completed")}
                      </Button>
                    </div>
                  )}

                  {/* Action 5: Cancel order */}
                  {selectedOrder.orderStatus !== "completed" &&
                    selectedOrder.orderStatus !== "cancelled" && (
                      <div className="pt-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          {t("Hủy Đơn Hàng & Hoàn Kho", "Cancel Order & Release Stock")}
                        </Button>
                      </div>
                    )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#F7F4EE] border-t border-[#E6E0D5] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
              >
                {t("Đóng Cửa Sổ", "Close")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
