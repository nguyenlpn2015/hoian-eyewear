import { NextResponse, type NextRequest } from "next/server";
import { expireStaleOrders } from "@/lib/data/orders";
import { logger } from "@/lib/logger";

/**
 * Scheduled Cron Job Handler: Hủy đơn hàng VietQR quá hạn 24 giờ và tự động hoàn trả kho.
 * Được kích hoạt qua Vercel Cron, GitHub Actions hoặc webhook bên ngoài.
 * Yêu cầu Authorization: Bearer <CRON_SECRET> nếu CRON_SECRET được cấu hình.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    logger.warn("Unauthorized attempt to access cron order expiration endpoint", {
      ip: request.headers.get("x-forwarded-for") || "unknown",
    });
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing Bearer CRON_SECRET" },
      { status: 401 }
    );
  }

  try {
    const result = await expireStaleOrders();
    logger.info("Order expiration cron job executed successfully", {
      expiredCount: result.expiredCount,
      orderRefs: result.orderRefs,
    });
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    logger.error("Error executing order expiration cron job", err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
