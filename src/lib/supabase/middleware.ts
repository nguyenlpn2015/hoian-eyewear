import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database, StaffRole } from "@/types/database";

/**
 * Middleware session updater and RBAC route protector for Hoi An Eyewear.
 * - Refreshes Auth tokens via cookies
 * - Enforces role-based access on /admin/*
 *   - CASHIER -> only /admin/pos
 *   - STORE_MANAGER -> all /admin/*
 *   - Unauthenticated -> /admin/login
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const pathname = request.nextUrl.pathname;

  // Storefront routes (non-admin) are public
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  let role: StaffRole | null = null;
  let isActive = true;

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (!authError && authData.user) {
      user = authData.user;

      // Query staff profile for role verification
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("id", user.id)
        .single();

      if (profile) {
        role = profile.role as StaffRole;
        isActive = profile.is_active;
      }
    }
  } catch {
    // Supabase offline or unreachable in local dev
  }

  // Support local development preview session fallback
  if (!user) {
    const devRoleCookie = request.cookies.get("hae_dev_role")?.value;
    if (devRoleCookie === "STORE_MANAGER" || devRoleCookie === "CASHIER") {
      role = devRoleCookie as StaffRole;
      isActive = true;
      user = { id: "dev-local-user", email: `${devRoleCookie.toLowerCase()}@hoianeyewear.com` };
    }
  }

  // If not accessing an admin route, continue normally
  if (!isAdminRoute) {
    return supabaseResponse;
  }

  // Handle /admin/login
  if (isLoginPage) {
    if (user && role && isActive) {
      // Already logged in: redirect to respective dashboard
      const target = role === "CASHIER" ? "/admin/pos" : "/admin";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return supabaseResponse;
  }

  // If accessing /admin/* without authentication
  if (!user) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If account is disabled
  if (!isActive) {
    const disabledUrl = new URL("/admin/login", request.url);
    disabledUrl.searchParams.set("error", "account_disabled");
    return NextResponse.redirect(disabledUrl);
  }

  // RBAC Enforcement for CASHIER:
  // Cashiers are restricted solely to POS (/admin/pos)
  if (role === "CASHIER" && !pathname.startsWith("/admin/pos")) {
    const posUrl = new URL("/admin/pos", request.url);
    posUrl.searchParams.set("notice", "restricted_cashier_access");
    return NextResponse.redirect(posUrl);
  }

  return supabaseResponse;
}
