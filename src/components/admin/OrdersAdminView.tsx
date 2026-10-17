"use client";

import React, { useState } from "react";
import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Order, OrderStatus } from "@/types";
import {
  verifyPaymentAction,
  updateOrderStatusAction,
  cancelAdminOrderAction,
} from "@/app/admin/actions";
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
  AlertCircle,
} from "lucide-react";

interface OrdersAdminViewProps {
  initialOrders: Order[];
  staffRole?: string;
}

export default function OrdersAdminView({
  initialOrders,
  staffRole,
}: OrdersAdminViewProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fulfillment form states
  const [carrierName, setCarrierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedOrder(null);
    };
    if (selectedOrder) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedOrder]);

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
    setErrorMessage("");
  };

  const updateLocalOrderStatus = (orderId: string, newStatus: OrderStatus, extra?: { carrier?: string; tracking?: string }) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: newStatus,
              ...(extra?.carrier ? { shippingCarrier: extra.carrier } : {}),
              ...(extra?.tracking ? { trackingCode: extra.tracking } : {}),
            }
          : o
      )
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              orderStatus: newStatus,
              ...(extra?.carrier ? { shippingCarrier: extra.carrier } : {}),
              ...(extra?.tracking ? { trackingCode: extra.tracking } : {}),
            }
          : null
      );
    }
  };

  const handleVerifyPayment = async (orderId: string) => {
    if (!confirm("Xác nhận đã nhận đủ tiền chuyển khoản cho đơn hàng này?")) return;
    setErrorMessage("");
    setIsProcessing(true);

    const res = await verifyPaymentAction(orderId);
    setIsProcessing(false);

    if (!res.success) {
      setErrorMessage(res.error || "Không thể xác nhận thanh toán.");
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, paymentStatus: "paid" } : o))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, paymentStatus: "paid" });
    }
  };

  const handleShipOrder = async (orderId: string) => {
    if (!trackingCode.trim()) {
      alert("Vui lòng nhập mã vận đơn trước khi xác nhận gửi hàng.");
      return;
    }
    setErrorMessage("");
    setIsProcessing(true);

    const res = await updateOrderStatusAction(orderId, "shipped", carrierName, trackingCode.trim());
    setIsProcessing(false);

    if (!res.success) {
      setErrorMessage(res.error || "Không thể cập nhật trạng thái giao hàng.");
      return;
    }

    updateLocalOrderStatus(orderId, "shipped", { carrier: carrierName, tracking: trackingCode.trim() });
    alert(`Đã cập nhật đơn hàng thành Đang giao hàng với mã ${trackingCode}!`);
  };

  const handleReadyForPickup = async (orderId: string) => {
    setErrorMessage("");
    setIsProcessing(true);

    const res = await updateOrderStatusAction(orderId, "ready_for_pickup");
    setIsProcessing(false);

    if (!res.success) {
      setErrorMessage(res.error || "Không thể cập nhật trạng thái.");
      return;
    }

    updateLocalOrderStatus(orderId, "ready_for_pickup");
    alert("Đã đánh dấu sẵn sàng để khách đến nhận tại boutique Hội An!");
  };

  const handleCompleteOrder = async (orderId: string) => {
    setErrorMessage("");
    setIsProcessing(true);

    const res = await updateOrderStatusAction(orderId, "completed");
    setIsProcessing(false);

    if (!res.success) {
      setErrorMessage(res.error || "Không thể hoàn tất đơn hàng.");
      return;
    }

    updateLocalOrderStatus(orderId, "completed");
    alert("Đơn hàng đã hoàn tất thành công!");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này? Tồn kho đã giữ chỗ sẽ được tự động hoàn lại.")) {
      return;
    }
    setErrorMessage("");
    setIsProcessing(true);

    const res = await cancelAdminOrderAction(orderId, "Hủy bởi nhân viên quản trị");
    setIsProcessing(false);

    if (!res.success) {
      setErrorMessage(res.error || "Không thể hủy đơn hàng.");
      return;
    }

    updateLocalOrderStatus(orderId, "cancelled");
    alert("Đã hủy đơn hàng và giải phóng tồn kho giữ chỗ!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1715]">
            Quản Lý & Xử Lý Đơn Hàng
          </h1>
          <p className="text-xs text-[#6E6962] mt-0.5">
            Theo dõi trạng thái đơn hàng, đối soát thanh toán chuyển khoản và điều phối giao hàng trên Supabase PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#6E6962] font-mono">
            Tổng cộng: <strong>{orders.length}</strong> đơn
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
              placeholder="Tìm theo mã đơn (HAE-...), tên khách, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E6E0D5] bg-[#FDFBF7] focus:bg-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-[#8C827A] shrink-0" />
            {[
              { id: "all", label: "Tất cả" },
              { id: "pending", label: "Chờ xử lý" },
              { id: "confirmed", label: "Đã xác nhận" },
              { id: "ready_for_pickup", label: "Sẵn sàng nhận" },
              { id: "shipped", label: "Đang giao" },
              { id: "completed", label: "Hoàn tất" },
              { id: "cancelled", label: "Đã hủy" },
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
            <option value="all">Mọi kênh bán</option>
            <option value="online">Chỉ Online</option>
            <option value="in_store">Chỉ Tại quầy (POS)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E6E0D5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F7F4EE] border-b border-[#E6E0D5] text-[#6E6962] uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Mã Đơn / Kênh</th>
                <th className="py-3 px-4">Khách Hàng</th>
                <th className="py-3 px-4">Sản Phẩm & SL</th>
                <th className="py-3 px-4">Tổng Tiền</th>
                <th className="py-3 px-4">Thanh Toán</th>
                <th className="py-3 px-4">Trạng Thái Đơn</th>
                <th className="py-3 px-4 text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E0D5]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#8C827A]">
                    Không tìm thấy đơn hàng nào phù hợp bộ lọc.
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
                            Nhận tại quầy
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-600 block truncate max-w-[150px]">
                            {ord.shippingAddress?.province}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-[#1A1715]">
                          {totalItems} món
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
                          Chi Tiết
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
                    Đơn hàng: {selectedOrder.orderRef}
                  </span>
                  <span className="text-xs bg-[#2C2623] text-gray-300 px-2 py-0.5 rounded font-mono">
                    {selectedOrder.channel === "in_store" ? "Boutique POS" : "Online Store"}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Thời gian đặt: {formatDate(selectedOrder.createdAt)}
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
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Order Status Banners */}
              <div className="grid grid-cols-2 gap-4 bg-[#F7F4EE] p-4 rounded-xl border border-[#E6E0D5]">
                <div>
                  <span className="text-[11px] font-semibold text-[#8C827A] uppercase block mb-1">
                    Trạng Thái Đơn Hàng
                  </span>
                  <OrderStatusBadge status={selectedOrder.orderStatus} />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#8C827A] uppercase block mb-1">
                    Trạng Thái Thanh Toán
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
                    Thông Tin Khách Hàng
                  </h3>
                  <div>
                    <span className="text-[#6E6962]">Tên: </span>
                    <strong className="text-[#1A1715]">{selectedOrder.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-[#6E6962]">Điện thoại: </span>
                    <strong className="text-[#1A1715] font-mono">{selectedOrder.customerPhone}</strong>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div>
                      <span className="text-[#6E6962]">Email: </span>
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                </div>

                {/* Fulfillment Info */}
                <div className="space-y-2 border border-[#E6E0D5] p-3.5 rounded-xl">
                  <h3 className="font-bold text-sm text-[#1A1715] flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                    Phương Thức Nhận Hàng
                  </h3>
                  <div>
                    <span className="text-[#6E6962]">Hình thức: </span>
                    <strong className="text-[#1A1715]">
                      {selectedOrder.fulfillmentType === "pickup"
                        ? "Nhận tại quầy boutique Hội An"
                        : "Giao hàng tận nơi"}
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
                      Đơn vị vận chuyển: {selectedOrder.shippingCarrier} — Mã:{" "}
                      <span className="font-mono font-bold">{selectedOrder.trackingCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div>
                <h3 className="font-bold text-sm text-[#1A1715] mb-3">
                  Danh Sách Sản Phẩm Trong Đơn
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
                    <span className="text-[#6E6962]">Phí vận chuyển:</span>
                    <span className="font-medium">
                      {selectedOrder.shippingFee === 0
                        ? "Miễn phí"
                        : formatCurrency(selectedOrder.shippingFee)}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F4EE] flex justify-between items-center text-sm font-bold">
                    <span className="text-[#1A1715]">Tổng thanh toán:</span>
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
                  Thao Tác Xử Lý Đơn Hàng ({staffRole || "STAFF"})
                </h4>

                <div className="space-y-3">
                  {/* Action 1: Verify Bank Transfer Payment */}
                  {selectedOrder.paymentMethod === "bank_transfer" &&
                    selectedOrder.paymentStatus === "pending" && (
                      <div className="p-3 bg-white rounded-lg border border-amber-300 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-amber-900">
                            Chờ Xác Minh Chuyển Khoản
                          </div>
                          <div className="text-[11px] text-amber-700">
                            Khách đã đặt qua VietQR. Vui lòng kiểm tra sao kê ngân hàng trước khi xác nhận.
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleVerifyPayment(selectedOrder.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 ml-3"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Xác Nhận Đã Nhận Tiền
                        </Button>
                      </div>
                    )}

                  {/* Action 2: Shipping for online delivery */}
                  {selectedOrder.fulfillmentType === "delivery" &&
                    selectedOrder.orderStatus === "confirmed" && (
                      <div className="p-3 bg-white rounded-lg border border-[#E6E0D5] space-y-2">
                        <div className="font-bold text-xs text-[#1A1715]">
                          Gửi hàng qua đơn vị vận chuyển (GHTK / Viettel Post)
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Đơn vị vận chuyển (VD: GHTK)"
                            value={carrierName}
                            onChange={(e) => setCarrierName(e.target.value)}
                            className="text-xs p-2 rounded border border-[#E6E0D5]"
                          />
                          <input
                            type="text"
                            placeholder="Mã vận đơn (VD: S218931.MN1.88)"
                            value={trackingCode}
                            onChange={(e) => setTrackingCode(e.target.value)}
                            className="text-xs p-2 rounded border border-[#E6E0D5] font-mono"
                          />
                        </div>
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleShipOrder(selectedOrder.id)}
                          className="w-full bg-[#1A1715] text-white"
                        >
                          <Truck className="w-3.5 h-3.5 mr-1" />
                          Xác Nhận Đã Gửi Hàng Cho Shipper
                        </Button>
                      </div>
                    )}

                  {/* Action 3: Ready for pickup */}
                  {selectedOrder.fulfillmentType === "pickup" &&
                    selectedOrder.orderStatus === "confirmed" && (
                      <div className="p-3 bg-white rounded-lg border border-[#E6E0D5] flex items-center justify-between">
                        <div>
                          <div className="font-bold text-xs text-[#1A1715]">
                            Hàng đã sẵn sàng tại boutique?
                          </div>
                          <div className="text-[11px] text-[#6E6962]">
                            Thông báo cho khách hàng đến quầy nhận kính.
                          </div>
                        </div>
                        <Button
                          size="sm"
                          disabled={isProcessing}
                          onClick={() => handleReadyForPickup(selectedOrder.id)}
                          className="bg-[#2C5234] text-white shrink-0 ml-3"
                        >
                          <PackageCheck className="w-3.5 h-3.5 mr-1" />
                          Báo Sẵn Sàng Nhận
                        </Button>
                      </div>
                    )}

                  {/* Action 4: Complete order */}
                  {(selectedOrder.orderStatus === "shipped" ||
                    selectedOrder.orderStatus === "ready_for_pickup") && (
                    <div className="p-3 bg-white rounded-lg border border-emerald-300 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-emerald-900">
                          Xác nhận hoàn tất đơn hàng
                        </div>
                        <div className="text-[11px] text-emerald-700">
                          Khách đã nhận được hàng và thanh toán đủ.
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleCompleteOrder(selectedOrder.id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0 ml-3"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Đánh Dấu Hoàn Tất
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
                          disabled={isProcessing}
                          onClick={() => handleCancelOrder(selectedOrder.id)}
                          className="text-rose-600 border-rose-300 hover:bg-rose-50 text-xs"
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          Hủy Đơn Hàng & Hoàn Kho
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
                Đóng Cửa Sổ
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

