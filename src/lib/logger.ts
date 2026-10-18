/**
 * Hoi An Eyewear — Structured & PII-Safe Logger
 * Đảm bảo ghi log có cấu trúc, tự động lọc và ẩn danh (masking) PII và Secrets,
 * phục vụ giám sát vận hành (Vercel Log Drains, BetterStack, Axiom).
 */

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name?: string;
    message: string;
    stack?: string;
  };
}

/**
 * Hàm khử nhạy cảm (sanitization) ngăn chặn rò rỉ PII và Secrets vào log hệ thống.
 */
function sanitizeValue(key: string, val: unknown): unknown {
  if (typeof val === "string") {
    // 1. Ẩn toàn bộ credentials / secrets
    if (/key|secret|token|password|auth|cookie|authorization/i.test(key)) {
      return "[REDACTED_SECRET]";
    }
    // 2. Ẩn JWT tokens
    if (val.startsWith("eyJh") && val.includes(".")) {
      return "[REDACTED_JWT]";
    }
    // 3. Ẩn Supabase secret keys
    if (val.startsWith("sb_secret_")) {
      return "[REDACTED_SERVICE_KEY]";
    }
    // 4. Ẩn số điện thoại Việt Nam
    if (/^(0|84)(3|5|7|8|9)[0-9]{8}$/.test(val) || /phone/i.test(key)) {
      return val.length >= 4 ? `*******${val.slice(-4)}` : "[REDACTED_PHONE]";
    }
    // 5. Ẩn Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || /email/i.test(key)) {
      const parts = val.split("@");
      return parts[0].length > 2
        ? `${parts[0].slice(0, 2)}***@${parts[1]}`
        : `*@${parts[1]}`;
    }
    // 6. Ẩn Họ tên khách hàng nếu key có chứa name
    if (/customer_?name|fullname|buyer/i.test(key)) {
      const words = val.trim().split(/\s+/);
      return words.map(w => (w.length > 1 ? `${w[0]}***` : w)).join(" ");
    }
  }

  if (val && typeof val === "object" && !Array.isArray(val)) {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      sanitizedObj[k] = sanitizeValue(k, v);
    }
    return sanitizedObj;
  }

  if (Array.isArray(val)) {
    return val.map(item => sanitizeValue(key, item));
  }

  return val;
}

function formatAndEmit(payload: LogPayload) {
  const isProd = process.env.NODE_ENV === "production";
  
  if (isProd) {
    // Ở production, xuất định dạng JSON một dòng (Single-line JSON) cho Log Drains
    const output = JSON.stringify(payload);
    if (payload.level === "error") {
      console.error(output);
    } else if (payload.level === "warn") {
      console.warn(output);
    } else {
      console.info(output);
    }
  } else {
    // Ở local dev, xuất định dạng có màu sắc dễ đọc cho kỹ sư
    const prefix = `[${payload.timestamp}] [${payload.level.toUpperCase()}] ${payload.message}`;
    if (payload.level === "error") {
      console.error(prefix, payload.error || "", payload.context || "");
    } else if (payload.level === "warn") {
      console.warn(prefix, payload.context || "");
    } else {
      console.info(prefix, payload.context || "");
    }
  }
}

export const logger = {
  info(message: string, context?: Record<string, unknown>) {
    const sanitizedContext = context
      ? (sanitizeValue("context", context) as Record<string, unknown>)
      : undefined;

    formatAndEmit({
      timestamp: new Date().toISOString(),
      level: "info",
      message,
      context: sanitizedContext,
    });
  },

  warn(message: string, context?: Record<string, unknown>) {
    const sanitizedContext = context
      ? (sanitizeValue("context", context) as Record<string, unknown>)
      : undefined;

    formatAndEmit({
      timestamp: new Date().toISOString(),
      level: "warn",
      message,
      context: sanitizedContext,
    });
  },

  error(message: string, error?: unknown, context?: Record<string, unknown>) {
    const sanitizedContext = context
      ? (sanitizeValue("context", context) as Record<string, unknown>)
      : undefined;

    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
          }
        : error
        ? { message: String(error) }
        : undefined;

    formatAndEmit({
      timestamp: new Date().toISOString(),
      level: "error",
      message,
      context: sanitizedContext,
      error: errorDetails,
    });
  },
};

