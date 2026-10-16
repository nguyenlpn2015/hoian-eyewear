import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in VND with dots as thousands separators
 * Example: 450000 -> "450.000 ₫"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount).replace("VND", "₫").trim();
}

/**
 * Format date depending on language
 */
export function formatDate(dateStr: string, lang: "vi" | "en" = "vi"): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  if (lang === "vi") {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const mins = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${mins} - ${day}/${month}/${year}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * PII Masking: Nguyen Van An -> Ng***** V** A*
 */
export function maskName(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 1) return part;
      if (part.length === 2) return part[0] + "*";
      return part[0] + "*".repeat(part.length - 2) + part[part.length - 1];
    })
    .join(" ");
}

/**
 * Phone Masking: 0905123456 -> 09****3456
 */
export function maskPhone(phone: string): string {
  if (!phone) return "";
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 6) return clean;
  return clean.slice(0, 2) + "****" + clean.slice(-4);
}

/**
 * Address Masking: 123 Quang Trung, P. Thach Thang... -> *** Quang Trung, P. Thach Thang...
 */
export function maskAddress(address: string): string {
  if (!address) return "";
  const commaIndex = address.indexOf(",");
  if (commaIndex > 0) {
    return "*** " + address.slice(address.indexOf(" ") + 1);
  }
  return "*** " + address;
}

