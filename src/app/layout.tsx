import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { CartDrawer } from "@/components/common/CartDrawer";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const serifFont = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hoi An Eyewear — Kính Mắt Phố Cổ Hội An",
  description:
    "Thương hiệu kính mát đương đại kết hợp tinh hoa phố cổ Hội An. Tròng Polarized chống lóa và UV400 bảo vệ mắt tối ưu.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`h-full antialiased ${sansFont.variable} ${serifFont.variable}`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#1A1715] font-sans">
        <AppProvider>
          <Suspense fallback={<div className="h-20 bg-[#1A1715]" />}>
            <Header />
          </Suspense>
          <CartDrawer />
          <main className="flex-1">
            <Suspense
              fallback={
                <div className="p-12 text-center text-xs text-[#8C827A]">
                  Đang tải...
                </div>
              }
            >
              {children}
            </Suspense>
          </main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
