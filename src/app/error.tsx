"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

/**
 * Global Next.js App Error Boundary
 * Hiển thị giao diện thông báo lỗi trang nhã mang phong cách Hội An Eyewear
 * thay vì màn hình lỗi mặc định của hạ tầng hosting.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log lỗi ra client console
    console.error("[App Error Boundary caught exception]:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-stone-50 dark:bg-stone-950">
      <div className="max-w-md w-full text-center bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 p-8 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            Đã có sự cố kết nối
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            Hệ thống đang gặp sự cố tạm thời khi tải dữ liệu từ máy chủ. Vui lòng thử tải lại trang hoặc quay về trang chủ.
          </p>
          {error.digest && (
            <p className="text-xs font-mono text-stone-400 dark:text-stone-500 pt-2">
              Mã lỗi (Digest): {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Thử tải lại
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-medium text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            Về Trang Chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

