"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  recordInStoreSale,
  cancelOrderAndReleaseStock,
  verifyBankTransferPayment,
} from "@/lib/data/orders";
import type { StaffRole, Database } from "@/types/database";
import type { OrderStatus } from "@/types";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

/**
 * Đăng nhập nhân viên nội bộ Hội An Eyewear
 */
export async function signInStaff(formData: FormData): Promise<AuthActionResult> {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const nextUrl = (formData.get("next") as string)?.trim();

  if (!email || !password) {
    return { success: false, error: "Vui lòng nhập đầy đủ email và mật khẩu." };
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.",
      };
    }

    if (!data.user) {
      return { success: false, error: "Không tìm thấy thông tin tài khoản." };
    }

    // Kiểm tra hồ sơ & quyền hạn trong bảng profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_active, full_name")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Tài khoản chưa được cấp quyền nhân viên trong hệ thống.",
      };
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: "Tài khoản nhân viên này đang bị tạm khóa. Vui lòng liên hệ quản lý.",
      };
    }

    // Điều hướng dựa trên vai trò
    const role = profile.role as StaffRole;
    let target = role === "CASHIER" ? "/admin/pos" : "/admin";
    if (nextUrl && nextUrl.startsWith("/admin")) {
      if (role === "CASHIER" && !nextUrl.startsWith("/admin/pos")) {
        target = "/admin/pos";
      } else {
        target = nextUrl;
      }
    }

    redirect(target);
  } catch (err) {
    // Nếu là lỗi redirect() của Next.js thì rethrow để Next.js xử lý điều hướng
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }

    return {
      success: false,
      error: "Không thể kết nối đến máy chủ xác thực. Nếu đang chạy cục bộ, bạn có thể dùng nút Đăng nhập nhanh kiểm thử.",
    };
  }
}

/**
 * Đăng xuất nhân viên
 */
export async function signOutStaff(): Promise<void> {
  const supabase = await createClient();
  try {
    await supabase.auth.signOut();
  } catch {
    // Ignore error if offline
  }

  const cookieStore = await cookies();
  cookieStore.delete("hae_dev_role");

  redirect("/admin/login");
}

/**
 * Thiết lập phiên đăng nhập nhanh môi trường kiểm thử cục bộ (Development Quick-Login)
 */
export async function setDevRole(role: StaffRole, nextUrl?: string): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Dev quick-login is disabled in production.");
  }

  const cookieStore = await cookies();
  cookieStore.set("hae_dev_role", role, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  let target = role === "CASHIER" ? "/admin/pos" : "/admin";
  if (nextUrl && nextUrl.startsWith("/admin")) {
    if (role === "CASHIER" && !nextUrl.startsWith("/admin/pos")) {
      target = "/admin/pos";
    } else {
      target = nextUrl;
    }
  }

  redirect(target);
}

/**
 * Lấy thông tin nhân viên hiện tại đang đăng nhập
 */
export async function getCurrentStaff() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, role, is_active, phone")
        .eq("id", user.id)
        .single();

      if (profile) {
        return {
          id: profile.id,
          fullName: profile.full_name,
          role: profile.role as StaffRole,
          isActive: profile.is_active,
          email: user.email,
          isDevSession: false,
        };
      }
    }
  } catch {
    // Supabase offline
  }

  // Fallback dev role cookie ONLY in non-production environments
  if (process.env.NODE_ENV !== "production") {
    const cookieStore = await cookies();
    const devRole = cookieStore.get("hae_dev_role")?.value as StaffRole | undefined;

    if (devRole === "STORE_MANAGER" || devRole === "CASHIER") {
      return {
        id: "dev-local-user",
        fullName: devRole === "STORE_MANAGER" ? "Lê Quản Lý (Dev)" : "Trần Thu Ngân (Dev)",
        role: devRole,
        isActive: true,
        email: `${devRole.toLowerCase()}@hoianeyewear.com`,
        isDevSession: true,
      };
    }
  }

  return null;
}

/**
 * Ghi nhận giao dịch bán tại quầy qua atomic RPC record_in_store_sale
 */
export async function recordInStoreSaleAction(
  variantId: string,
  quantity: number,
  paymentMethod: "cash" | "bank_transfer"
): Promise<{ success: boolean; orderRef?: string; error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff || !staff.isActive) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // Cả CASHIER và STORE_MANAGER đều được phép thực hiện bán lẻ tại quầy
  const actorId = staff.isDevSession
    ? (staff.role === "CASHIER" ? "e0000000-0000-0000-0000-000000000002" : "e0000000-0000-0000-0000-000000000001")
    : staff.id;

  const res = await recordInStoreSale({
    variantId,
    quantity,
    paymentMethod,
    actorId,
    customerName: "Khách Mua Tại Quầy Hội An",
    customerPhone: "0900000000",
  });

  if (res.success) {
    revalidatePath("/admin/pos");
    revalidatePath("/admin/inventory");
    revalidatePath("/admin/orders");
  }

  return {
    success: res.success,
    orderRef: res.orderRef,
    error: res.error,
  };
}

/**
 * Điều chỉnh tồn kho thủ công (Chỉ STORE_MANAGER)
 */
export async function adjustInventoryAction(
  variantId: string,
  delta: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff || !staff.isActive) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // Strict RBAC: Chỉ STORE_MANAGER mới có quyền can thiệp tồn kho thủ công
  if (staff.role !== "STORE_MANAGER") {
    return {
      success: false,
      error: "Quyền bị từ chối: Chỉ Quản lý cửa hàng (STORE_MANAGER) mới có quyền điều chỉnh số lượng tồn kho thủ công.",
    };
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. Kiểm tra tồn kho hiện tại
    const { data: balance, error: balErr } = await adminSupabase
      .from("inventory_balances")
      .select("quantity_on_hand, quantity_reserved")
      .eq("variant_id", variantId)
      .eq("location_id", "HOI_AN_MAIN")
      .single();

    if (balErr || !balance) {
      return { success: false, error: "Không tìm thấy thông tin biến thể trong kho." };
    }

    const newOnHand = balance.quantity_on_hand + delta;
    if (newOnHand < balance.quantity_reserved) {
      return {
        success: false,
        error: `Số lượng tồn sau điều chỉnh (${newOnHand}) không thể nhỏ hơn số lượng đang giữ chỗ đơn online (${balance.quantity_reserved}).`,
      };
    }

    if (newOnHand < 0) {
      return { success: false, error: "Tồn kho thực tế không thể âm." };
    }

    // 2. Cập nhật tồn kho
    const { error: updateErr } = await adminSupabase
      .from("inventory_balances")
      .update({
        quantity_on_hand: newOnHand,
        updated_at: new Date().toISOString(),
      })
      .eq("variant_id", variantId)
      .eq("location_id", "HOI_AN_MAIN");

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // 3. Ghi log chuyển động kiểm toán
    await adminSupabase.from("inventory_movements").insert({
      variant_id: variantId,
      location_id: "HOI_AN_MAIN",
      movement_type: "MANUAL_ADJUSTMENT",
      quantity_delta: delta,
      balance_on_hand_after: newOnHand,
      balance_reserved_after: balance.quantity_reserved,
      reference_id: `ADJ-${Date.now()}`,
      actor_id: staff.isDevSession ? "e0000000-0000-0000-0000-000000000001" : staff.id,
      actor_role: staff.role,
      reason,
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/admin/pos");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi khi điều chỉnh tồn kho.";
    return { success: false, error: msg };
  }
}

/**
 * Cập nhật trạng thái đơn hàng (Chỉ STORE_MANAGER)
 */
export async function updateOrderStatusAction(
  orderId: string,
  newStatus: OrderStatus,
  shippingCarrier?: string,
  trackingCode?: string
): Promise<{ success: boolean; error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff || !staff.isActive) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  // Strict RBAC: Chỉ STORE_MANAGER được chuyển trạng thái đơn hàng
  if (staff.role !== "STORE_MANAGER") {
    return {
      success: false,
      error: "Quyền bị từ chối: Chỉ Quản lý cửa hàng (STORE_MANAGER) mới có quyền cập nhật trạng thái đơn hàng.",
    };
  }

  try {
    const adminSupabase = createAdminClient();

    const updatePayload: Database["public"]["Tables"]["orders"]["Update"] = {
      order_status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (shippingCarrier) updatePayload.shipping_carrier = shippingCarrier;
    if (trackingCode) updatePayload.tracking_code = trackingCode;

    const { error } = await adminSupabase
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Ghi nhật ký trạng thái
    await adminSupabase.from("order_status_history").insert({
      order_id: orderId,
      to_status: newStatus,
      actor_id: staff.isDevSession ? "e0000000-0000-0000-0000-000000000001" : staff.id,
      actor_role: staff.role,
      note: trackingCode ? `Vận chuyển: ${shippingCarrier} - Mã vận đơn: ${trackingCode}` : "Cập nhật từ quản trị",
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Lỗi cập nhật trạng thái đơn.";
    return { success: false, error: msg };
  }
}

/**
 * Xác nhận thanh toán chuyển khoản (Chỉ STORE_MANAGER)
 */
export async function verifyPaymentAction(
  orderId: string,
  transactionRef?: string
): Promise<{ success: boolean; error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff || !staff.isActive) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  if (staff.role !== "STORE_MANAGER") {
    return {
      success: false,
      error: "Quyền bị từ chối: Chỉ Quản lý cửa hàng mới có quyền xác nhận thanh toán.",
    };
  }

  const res = await verifyBankTransferPayment(
    orderId,
    transactionRef || `TXN-${Date.now()}`,
    `Xác nhận thanh toán bởi ${staff.fullName}`,
    true
  );

  if (res.success) {
    revalidatePath("/admin/orders");
  }

  return res;
}

/**
 * Hủy đơn hàng và hoàn trả tồn kho giữ chỗ (Chỉ STORE_MANAGER)
 */
export async function cancelAdminOrderAction(
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const staff = await getCurrentStaff();
  if (!staff || !staff.isActive) {
    return { success: false, error: "Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại." };
  }

  if (staff.role !== "STORE_MANAGER") {
    return {
      success: false,
      error: "Quyền bị từ chối: Chỉ Quản lý cửa hàng mới có quyền hủy đơn.",
    };
  }

  const actorId = staff.isDevSession ? "e0000000-0000-0000-0000-000000000001" : staff.id;
  const res = await cancelOrderAndReleaseStock(orderId, actorId, staff.role, reason);

  if (res.success) {
    revalidatePath("/admin/orders");
    revalidatePath("/admin/inventory");
  }

  return res;
}
