import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Order, OrderItem, OrderStatus } from "@/types";
import { MOCK_ORDERS, MOCK_PRODUCTS } from "@/data/mock-data";
import { isSupabaseConfigured } from "./catalog";

export interface CreateOnlineOrderInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  fulfillmentType: "delivery" | "pickup";
  paymentMethod: "cod" | "bank_transfer";
  shippingAddress?: {
    province: string;
    district: string;
    ward: string;
    street: string;
    fullAddress: string;
  };
  shippingFee: number;
  customerNotes?: string;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
  idempotencyKey?: string;
}

export interface InStoreSaleInput {
  variantId: string;
  quantity: number;
  paymentMethod: "cash" | "bank_transfer";
  actorId: string;
  customerName?: string;
  customerPhone?: string;
}

export interface OrderOperationResult {
  success: boolean;
  orderId?: string;
  orderRef?: string;
  totalAmount?: number;
  error?: string;
}

interface DbOrderItemRow {
  id: string;
  variant_id: string;
  sku_snapshot: string;
  product_name_vi_snapshot: string;
  variant_name_vi_snapshot: string | null;
  unit_price_vnd: number;
  quantity: number;
  total_price_vnd: number;
  image_url_snapshot: string | null;
}

interface DbOrderRow {
  id: string;
  order_ref: string;
  channel: Order["channel"];
  fulfillment_type: Order["fulfillmentType"];
  order_status: Order["orderStatus"];
  payment_method: Order["paymentMethod"];
  payment_status: Order["paymentStatus"];
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  shipping_address?: {
    province?: string;
    district?: string;
    ward?: string;
    street?: string;
    full_address?: string;
  } | null;
  shipping_carrier?: string | null;
  tracking_code?: string | null;
  subtotal_vnd: number;
  shipping_fee_vnd: number;
  total_amount_vnd: number;
  customer_notes?: string | null;
  idempotency_key?: string | null;
  bank_transfer_expires_at?: string | null;
  created_at: string;
  updated_at: string;
  order_items?: DbOrderItemRow[];
}

interface RpcOrderResult {
  success: boolean;
  order_id?: string;
  order_ref?: string;
  total_amount?: number;
  total_amount_vnd?: number;
  error?: string;
}

/**
 * Maps database order row to domain Order interface
 */
function mapOrderRow(row: DbOrderRow): Order {
  const items: OrderItem[] = (row.order_items || []).map((item: DbOrderItemRow) => ({
    id: item.id,
    variantId: item.variant_id,
    sku: item.sku_snapshot,
    productName: item.product_name_vi_snapshot || "Kính Mát Hội An",
    variantDescription: item.variant_name_vi_snapshot || "",
    unitPrice: item.unit_price_vnd,
    quantity: item.quantity,
    totalPrice: item.total_price_vnd,
    imageUrl: item.image_url_snapshot || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
  }));

  return {
    id: row.id,
    orderRef: row.order_ref,
    channel: row.channel,
    fulfillmentType: row.fulfillment_type,
    orderStatus: row.order_status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || undefined,
    shippingAddress: row.shipping_address
      ? {
          province: row.shipping_address.province || "",
          district: row.shipping_address.district || "",
          ward: row.shipping_address.ward || "",
          street: row.shipping_address.street || "",
          fullAddress: row.shipping_address.full_address || "",
        }
      : undefined,
    shippingCarrier: row.shipping_carrier || undefined,
    trackingCode: row.tracking_code || undefined,
    subtotal: row.subtotal_vnd,
    shippingFee: row.shipping_fee_vnd,
    totalAmount: row.total_amount_vnd,
    customerNotes: row.customer_notes || undefined,
    idempotencyKey: row.idempotency_key || undefined,
    items,
    bankTransferExpiresAt: row.bank_transfer_expires_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Create online order via Supabase atomic RPC create_online_order
 */
export async function createOnlineOrder(input: CreateOnlineOrderInput): Promise<OrderOperationResult> {
  if (!isSupabaseConfigured()) {
    // Local fallback creation
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randomChars2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderRef = `HAE-${randomChars}-${randomChars2}`;

    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const item of input.items) {
      let foundVariant = null;
      let foundProduct = null;
      for (const prod of MOCK_PRODUCTS) {
        const v = prod.variants.find((vr) => vr.id === item.variantId);
        if (v) {
          foundVariant = v;
          foundProduct = prod;
          break;
        }
      }

      const unitPrice = foundVariant ? foundVariant.price : 450000;
      const total = unitPrice * item.quantity;
      subtotal += total;

      orderItems.push({
        id: `item-${Date.now()}-${item.variantId}`,
        variantId: item.variantId,
        sku: foundVariant?.sku || "HAE-SKU-MOCK",
        productName: foundProduct?.name_vi || "Kính Mát Hội An",
        variantDescription: foundVariant?.colorName_vi || "Tiêu chuẩn",
        unitPrice,
        quantity: item.quantity,
        totalPrice: total,
        imageUrl: foundVariant?.imageUrl || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
      });
    }

    const totalAmount = subtotal + input.shippingFee;
    const newOrder: Order = {
      id: `ord-mock-${Date.now()}`,
      orderRef,
      channel: "online",
      fulfillmentType: input.fulfillmentType,
      orderStatus: "confirmed",
      paymentMethod: input.paymentMethod,
      paymentStatus: "pending",
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      shippingAddress: input.shippingAddress,
      subtotal,
      shippingFee: input.shippingFee,
      totalAmount,
      customerNotes: input.customerNotes,
      idempotencyKey: input.idempotencyKey,
      items: orderItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_ORDERS.unshift(newOrder);

    return {
      success: true,
      orderId: newOrder.id,
      orderRef,
      totalAmount,
    };
  }

  try {
    const supabase = await createClient();

    const dbItems = input.items.map((i) => ({
      variant_id: i.variantId,
      quantity: i.quantity,
    }));

    const { data, error } = await supabase.rpc("create_online_order", {
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_customer_email: input.customerEmail || null,
      p_fulfillment_type: input.fulfillmentType,
      p_payment_method: input.paymentMethod,
      p_shipping_province: input.shippingAddress?.province || null,
      p_shipping_district: input.shippingAddress?.district || null,
      p_shipping_ward: input.shippingAddress?.ward || null,
      p_shipping_street: input.shippingAddress?.street || null,
      p_shipping_full_address: input.shippingAddress?.fullAddress || null,
      p_shipping_fee: input.shippingFee,
      p_customer_notes: input.customerNotes || null,
      p_items: dbItems,
      p_idempotency_key: input.idempotencyKey || null,
    });

    if (error) {
      console.error("[Orders Service] RPC create_online_order failed:", error);
      return { success: false, error: error.message };
    }

    const res = data as unknown as RpcOrderResult | null;
    if (!res || !res.success) {
      return { success: false, error: res?.error || "Không thể khởi tạo đơn hàng." };
    }

    return {
      success: true,
      orderId: res.order_id,
      orderRef: res.order_ref,
      totalAmount: res.total_amount_vnd ?? res.total_amount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi kết nối máy chủ tạo đơn hàng.";
    console.error("[Orders Service] Error creating online order:", err);
    return { success: false, error: message };
  }
}

/**
 * Record in-store sale via Supabase atomic RPC record_in_store_sale
 */
export async function recordInStoreSale(input: InStoreSaleInput): Promise<OrderOperationResult> {
  if (!isSupabaseConfigured()) {
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderRef = `HAE-POS-${randomChars}`;

    let foundVariant = null;
    let foundProduct = null;
    for (const prod of MOCK_PRODUCTS) {
      const v = prod.variants.find((vr) => vr.id === input.variantId);
      if (v) {
        foundVariant = v;
        foundProduct = prod;
        break;
      }
    }

    const unitPrice = foundVariant ? foundVariant.price : 450000;
    const totalAmount = unitPrice * input.quantity;

    const newOrder: Order = {
      id: `ord-pos-${Date.now()}`,
      orderRef,
      channel: "in_store",
      fulfillmentType: "pickup",
      orderStatus: "completed",
      paymentMethod: input.paymentMethod,
      paymentStatus: "paid",
      customerName: input.customerName || "Khách mua tại quầy",
      customerPhone: input.customerPhone || "Tại boutique",
      subtotal: totalAmount,
      shippingFee: 0,
      totalAmount,
      items: [
        {
          id: `item-${Date.now()}`,
          variantId: input.variantId,
          sku: foundVariant?.sku || "HAE-POS-SKU",
          productName: foundProduct?.name_vi || "Kính Mát Hội An",
          variantDescription: foundVariant?.colorName_vi || "Tiêu chuẩn",
          unitPrice,
          quantity: input.quantity,
          totalPrice: totalAmount,
          imageUrl: foundVariant?.imageUrl || "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    MOCK_ORDERS.unshift(newOrder);

    return {
      success: true,
      orderId: newOrder.id,
      orderRef,
      totalAmount,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("record_in_store_sale", {
      p_variant_id: input.variantId,
      p_quantity: input.quantity,
      p_payment_method: input.paymentMethod,
      p_actor_id: input.actorId,
      p_customer_name: input.customerName || "Khách mua tại quầy",
      p_customer_phone: input.customerPhone || "Tại boutique",
    });

    if (error) {
      console.error("[Orders Service] RPC record_in_store_sale failed:", error);
      return { success: false, error: error.message };
    }

    const res = data as unknown as RpcOrderResult | null;
    if (!res || !res.success) {
      return { success: false, error: res?.error || "Giao dịch bán tại quầy không thành công." };
    }

    return {
      success: true,
      orderId: res.order_id,
      orderRef: res.order_ref,
      totalAmount: res.total_amount_vnd ?? res.total_amount,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xử lý giao dịch tại quầy.";
    console.error("[Orders Service] Error recording POS sale:", err);
    return { success: false, error: message };
  }
}

/**
 * Fetch order by its human-readable reference (e.g. HAE-8K2M-9X4W)
 */
export async function getOrderByRef(orderRef: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Orders Service] Supabase configuration required in production.");
    }
    return MOCK_ORDERS.find((o) => o.orderRef === orderRef) || null;
  }

  try {
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase
      .from("orders")
      .select(`
        *,
        order_items(*)
      `)
      .eq("order_ref", orderRef)
      .single();

    if (error || !data) {
      if (process.env.NODE_ENV === "production") {
        return null;
      }
      return MOCK_ORDERS.find((o) => o.orderRef === orderRef) || null;
    }

    return mapOrderRow(data as unknown as DbOrderRow);
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Orders Service] Error fetching order by ref, using dev fallback:", err);
    return MOCK_ORDERS.find((o) => o.orderRef === orderRef) || null;
  }
}

/**
 * List orders for administration dashboard
 */
export async function listAdminOrders(options?: {
  channel?: "online" | "in_store";
  status?: OrderStatus;
}): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Orders Service] Supabase configuration required in production.");
    }
    let list = [...MOCK_ORDERS];
    if (options?.channel) {
      list = list.filter((o) => o.channel === options.channel);
    }
    if (options?.status) {
      list = list.filter((o) => o.orderStatus === options.status);
    }
    return list;
  }

  try {
    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("orders")
      .select(`
        *,
        order_items(*)
      `)
      .order("created_at", { ascending: false });

    if (options?.channel) {
      query = query.eq("channel", options.channel);
    }
    if (options?.status) {
      query = query.eq("order_status", options.status);
    }

    const { data, error } = await query;
    if (error) {
      if (process.env.NODE_ENV === "production") {
        throw new Error(`[Orders Service] Database error listing orders: ${error.message}`);
      }
      console.warn("[Orders Service] Using dev fallback orders:", error.message);
      return MOCK_ORDERS;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return (data as unknown as DbOrderRow[]).map(mapOrderRow);
  } catch (err) {
    if (process.env.NODE_ENV === "production") {
      throw err;
    }
    console.warn("[Orders Service] Error listing admin orders, using dev fallback:", err);
    return MOCK_ORDERS;
  }
}

/**
 * Cancel order and release stock via RPC cancel_order_and_release_stock
 */
export async function cancelOrderAndReleaseStock(
  orderId: string,
  actorId: string,
  actorRole: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Orders Service] Supabase configuration required in production.");
    }
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (order) {
      order.orderStatus = "cancelled";
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy đơn hàng." };
  }

  try {
    // SYSTEM task hoặc Store Manager Server Action sử dụng adminClient
    const client = actorRole === "SYSTEM" ? createAdminClient() : await createClient();
    const { data, error } = await client.rpc("cancel_order_and_release_stock", {
      p_order_id: orderId,
      p_actor_id: actorId,
      p_actor_role: actorRole,
      p_reason: reason || "Khách yêu cầu hủy đơn",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const res = data as unknown as { success: boolean; error?: string } | null;
    return {
      success: res?.success ?? false,
      error: res?.error,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi hủy đơn hàng.";
    return { success: false, error: message };
  }
}

/**
 * Verify bank transfer payment via RPC verify_bank_transfer_payment
 */
export async function verifyBankTransferPayment(
  orderId: string,
  transactionRef: string,
  note?: string,
  useAdminClient?: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("[Orders Service] Supabase configuration required in production.");
    }
    const order = MOCK_ORDERS.find((o) => o.id === orderId);
    if (order) {
      order.paymentStatus = "paid";
      return { success: true };
    }
    return { success: false, error: "Không tìm thấy đơn hàng." };
  }

  try {
    const client = useAdminClient ? createAdminClient() : await createClient();
    const { data, error } = await client.rpc("verify_bank_transfer_payment", {
      p_order_id: orderId,
      p_transaction_ref: transactionRef,
      p_note: note || "Xác nhận chuyển khoản",
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const res = data as unknown as { success: boolean; error?: string } | null;
    return {
      success: res?.success ?? false,
      error: res?.error,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi xác thực chuyển khoản.";
    return { success: false, error: message };
  }
}

/**
 * Tự động hủy các đơn hàng chuyển khoản VietQR quá hạn 24 giờ và hoàn trả tồn kho
 */
export async function expireStaleOrders(): Promise<{ expiredCount: number; orderRefs: string[] }> {
  if (!isSupabaseConfigured()) {
    return { expiredCount: 0, orderRefs: [] };
  }

  const adminSupabase = createAdminClient();
  const now = new Date().toISOString();

  // Tìm các đơn hàng pending chuyển khoản đã quá hạn 24h
  const { data: staleOrders, error } = await adminSupabase
    .from("orders")
    .select("id, order_ref")
    .eq("order_status", "pending")
    .eq("payment_method", "bank_transfer")
    .lt("bank_transfer_expires_at", now);

  if (error || !staleOrders || staleOrders.length === 0) {
    return { expiredCount: 0, orderRefs: [] };
  }

  const expiredRefs: string[] = [];
  for (const order of staleOrders) {
    const res = await cancelOrderAndReleaseStock(
      order.id,
      "00000000-0000-0000-0000-000000000000",
      "SYSTEM",
      "Hết hạn thanh toán chuyển khoản VietQR 24h - Tự động hủy và hoàn kho"
    );
    if (res.success) {
      expiredRefs.push(order.order_ref);
    }
  }

  return { expiredCount: expiredRefs.length, orderRefs: expiredRefs };
}
