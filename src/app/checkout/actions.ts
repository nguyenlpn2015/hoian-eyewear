"use server";

import { revalidatePath } from "next/cache";
import { createOnlineOrder } from "@/lib/data/orders";
import { createPublicClient } from "@/lib/supabase/server";
import { VIETNAM_PROVINCES } from "@/data/mock-data";
import type { FulfillmentType } from "@/types";

export interface CreateOrderFormInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: FulfillmentType;
  paymentMethod: "cod" | "bank_transfer";
  provinceCode?: string;
  district?: string;
  ward?: string;
  street?: string;
  customerNotes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  idempotencyKey?: string;
}

export interface CreateOrderActionResult {
  success: boolean;
  orderRef?: string;
  orderId?: string;
  totalAmount?: number;
  error?: string;
}

/**
 * Server Action xử lý đặt hàng online (khách vãng lai và thành viên)
 * Xác thực thông tin, tính phí ship chuẩn hóa và gọi RPC create_online_order
 */
export async function createOnlineOrderAction(
  input: CreateOrderFormInput
): Promise<CreateOrderActionResult> {
  // 1. Kiểm tra họ tên
  const name = (input.customerName || "").trim();
  if (!name) {
    return { success: false, error: "Vui lòng nhập họ và tên người nhận." };
  }

  // 2. Kiểm tra định dạng số điện thoại Việt Nam 10 chữ số
  const cleanPhone = (input.customerPhone || "").replace(/\D/g, "");
  if (!/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(cleanPhone)) {
    return {
      success: false,
      error: "Vui lòng nhập số điện thoại di động hợp lệ (10 chữ số, ví dụ: 0905123456).",
    };
  }

  // 3. Kiểm tra giỏ hàng
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Giỏ hàng của bạn đang trống." };
  }

  for (const item of input.items) {
    if (!item.variantId || item.quantity <= 0) {
      return { success: false, error: "Thông tin sản phẩm trong giỏ hàng không hợp lệ." };
    }
    if (item.quantity > 50) {
      return { success: false, error: "Số lượng cho mỗi sản phẩm tối đa là 50 chiếc." };
    }
  }

  // 4. Chuẩn hóa địa chỉ giao hàng và phí vận chuyển
  let shippingAddress: {
    province: string;
    district: string;
    ward: string;
    street: string;
    fullAddress: string;
  } | undefined = undefined;

  let calculatedShippingFee = 0;

  if (input.fulfillmentType === "delivery") {
    const prov = VIETNAM_PROVINCES.find((p) => p.code === input.provinceCode);
    const provinceName = prov?.name || "Việt Nam";
    const district = (input.district || "").trim();
    const ward = (input.ward || "").trim();
    const street = (input.street || "").trim();

    if (!district || !ward || !street) {
      return {
        success: false,
        error: "Vui lòng điền đầy đủ địa chỉ nhận hàng (Quận/Huyện, Phường/Xã, Số nhà).",
      };
    }

    const fullAddress = `${street}, ${ward}, ${district}, ${provinceName}`;
    shippingAddress = {
      province: provinceName,
      district,
      ward,
      street,
      fullAddress,
    };

    // Tính toán subtotal trực tiếp từ CSDL để áp dụng quy tắc miễn phí vận chuyển >= 500.000đ
    let subtotal = 0;
    try {
      const publicSupabase = createPublicClient();
      const variantIds = input.items.map((i) => i.variantId);
      const { data: dbVariants } = await publicSupabase
        .from("product_variants")
        .select("id, price_vnd")
        .in("id", variantIds);

      if (dbVariants && dbVariants.length > 0) {
        const priceMap = new Map(dbVariants.map((v) => [v.id, v.price_vnd]));
        for (const item of input.items) {
          const unitPrice = priceMap.get(item.variantId) || 0;
          subtotal += unitPrice * item.quantity;
        }
      }
    } catch {
      // Fallback
    }

    if (subtotal >= 500000) {
      calculatedShippingFee = 0; // Miễn phí vận chuyển toàn quốc cho đơn từ 500k
    } else {
      // Phí ship: Vùng 1 (Đà Nẵng / Quảng Nam): 20.000đ, Vùng khác: 35.000đ
      calculatedShippingFee = prov?.zone === 1 ? 20000 : 35000;
    }
  }

  // 5. Tạo idempotency key ngẫu nhiên bảo vệ chống click đúp
  const idempotencyKey = input.idempotencyKey || `chk-${crypto.randomUUID()}`;

  // 6. Gọi RPC create_online_order trong Data Access Layer
  const res = await createOnlineOrder({
    customerName: name,
    customerPhone: cleanPhone,
    customerEmail: input.customerEmail?.trim() || undefined,
    fulfillmentType: input.fulfillmentType,
    paymentMethod: input.paymentMethod,
    shippingAddress,
    shippingFee: calculatedShippingFee,
    customerNotes: input.customerNotes?.trim() || undefined,
    items: input.items,
    idempotencyKey,
  });

  if (res.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/pos");
  }

  return {
    success: res.success,
    orderRef: res.orderRef,
    orderId: res.orderId,
    totalAmount: res.totalAmount,
    error: res.error,
  };
}
