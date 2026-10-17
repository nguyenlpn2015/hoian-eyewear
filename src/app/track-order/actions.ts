"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { MOCK_ORDERS } from "@/data/mock-data";
import { maskName, maskPhone, maskAddress } from "@/lib/utils";

export interface GuestTrackResult {
  success: boolean;
  error?: string;
  order?: {
    order_ref: string;
    order_status: string;
    payment_status: string;
    fulfillment_type: string;
    masked_name: string;
    masked_phone: string;
    masked_address: string;
    shipping_carrier?: string | null;
    tracking_code?: string | null;
    total_amount: number;
    created_at: string;
    items: Array<{
      sku: string;
      product_name: string;
      variant_description: string;
      unit_price: number;
      quantity: number;
      total_price: number;
      image_url: string;
    }>;
  };
}

/**
 * Server Action tra cứu đơn hàng khách vãng lai bảo mật 2 lớp kèm Rate Limiting
 */
export async function trackOrderAction(
  orderRef: string,
  phoneInput: string
): Promise<GuestTrackResult> {
  const reqHeaders = await headers();
  const forwardedFor = reqHeaders.get("x-forwarded-for");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";

  // 1. Kiểm tra giới hạn tần suất (10 yêu cầu/phút/IP)
  const rateLimit = checkRateLimit(`guest_tracking:${clientIp}`, {
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!rateLimit.success) {
    const secondsWait = Math.ceil(rateLimit.resetMs / 1000);
    return {
      success: false,
      error: `Bạn đã tra cứu quá nhiều lần. Nhằm bảo mật đơn hàng, vui lòng thử lại sau ${secondsWait} giây.`,
    };
  }

  const cleanRef = (orderRef || "").trim().toUpperCase();
  const cleanPhone = (phoneInput || "").replace(/\D/g, "");

  if (!cleanRef || cleanPhone.length < 4) {
    return {
      success: false,
      error: "Mã đơn hàng và số điện thoại không hợp lệ.",
    };
  }

  const phoneLast4 = cleanPhone.slice(-4);

  // 2. Thử truy vấn qua Supabase RPC verify_guest_order_tracking
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("verify_guest_order_tracking", {
      p_order_ref: cleanRef,
      p_phone_last4: phoneLast4,
    });

    if (!error && data && typeof data === "object") {
      const result = data as { success: boolean; error?: string; order?: GuestTrackResult["order"] };
      if (result.success && result.order) {
        return {
          success: true,
          order: result.order,
        };
      }
    }
  } catch {
    // Supabase offline / local preview fallback
  }

  // 3. Fallback dữ liệu kiểm thử cục bộ nếu Supabase offline
  const mockMatch = MOCK_ORDERS.find((o) => {
    const refMatch = o.orderRef.toUpperCase() === cleanRef;
    const phoneDigits = o.customerPhone.replace(/\D/g, "");
    const phoneMatch = phoneDigits.endsWith(phoneLast4);
    return refMatch && phoneMatch;
  });

  if (mockMatch) {
    return {
      success: true,
      order: {
        order_ref: mockMatch.orderRef,
        order_status: mockMatch.orderStatus,
        payment_status: mockMatch.paymentStatus,
        fulfillment_type: mockMatch.fulfillmentType,
        masked_name: maskName(mockMatch.customerName),
        masked_phone: maskPhone(mockMatch.customerPhone),
        masked_address: maskAddress(mockMatch.shippingAddress?.fullAddress || ""),
        shipping_carrier: mockMatch.shippingCarrier || null,
        tracking_code: mockMatch.trackingCode || null,
        total_amount: mockMatch.totalAmount,
        created_at: mockMatch.createdAt,
        items: mockMatch.items.map((it) => ({
          sku: it.sku,
          product_name: it.productName,
          variant_description: it.variantDescription,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          total_price: it.totalPrice,
          image_url: it.imageUrl,
        })),
      },
    };
  }

  return {
    success: false,
    error: "Thông tin mã đơn hàng hoặc số điện thoại không chính xác. Vui lòng kiểm tra lại tin nhắn hoặc email.",
  };
}

