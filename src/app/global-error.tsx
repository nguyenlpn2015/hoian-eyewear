"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-stone-800 rounded-2xl border border-stone-700 p-8 text-center space-y-6">
          <h2 className="text-2xl font-serif font-bold text-amber-400">
            Hội An Eyewear
          </h2>
          <p className="text-stone-300 text-sm">
            Ứng dụng gặp sự cố không mong muốn. Vui lòng bấm thử lại để tiếp tục.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors"
          >
            Tải lại ứng dụng
          </button>
        </div>
      </body>
    </html>
  );
}

