import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";

/**
 * Health Check API Endpoint: /api/health
 * Dùng cho các hệ thống giám sát thời gian thực (UptimeRobot, BetterStack, Vercel Health Check),
 * và deployment smoke tests.
 * 
 * Tuyệt đối không để rò rỉ secret key hoặc chi tiết lỗi nhạy cảm.
 */
export async function GET() {
  const startTime = performance.now();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "unconfigured",
        timestamp: new Date().toISOString(),
        error: "Supabase environment variables missing",
      },
      { status: 503 }
    );
  }

  try {
    // Tạo client nhẹ để probe kết nối database (chỉ đọc public categories)
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    });

    const { error } = await supabase
      .from("categories")
      .select("id")
      .limit(1);

    const latencyMs = Math.round(performance.now() - startTime);

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          database: "error",
          latencyMs,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        status: "healthy",
        database: "connected",
        latencyMs,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    logger.error("Health check probe encountered unexpected exception", err);
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

