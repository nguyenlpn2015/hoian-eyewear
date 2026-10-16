"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { StaffRole } from "@/types/database";

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

  // Fallback dev role cookie
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

  return null;
}

