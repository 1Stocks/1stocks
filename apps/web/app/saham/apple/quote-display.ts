import type { AppleQuoteResult, QuoteErrorCode } from "@1stocks/shared";

export type QuotedApple = Extract<AppleQuoteResult, { status: "quoted" }>;

const integer = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export function readRupiah(input: string): string | null {
  const value = input.trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)$/.test(value)) return null;
  const digits = value.replaceAll(".", "");
  if (digits.length > 12 || BigInt(digits) === 0n) return null;
  return BigInt(digits).toString();
}

export function formatAtomic(amount: string, decimals: number) {
  const digits = amount.padStart(decimals + 1, "0");
  if (decimals === 0) return integer.format(BigInt(digits));
  const whole = integer.format(BigInt(digits.slice(0, -decimals)));
  const fraction = digits.slice(-decimals).replace(/0+$/, "");
  return fraction ? `${whole},${fraction}` : whole;
}

export function isCurrentQuote(quote: Pick<QuotedApple, "expiresAt">, now: number) {
  return Date.parse(quote.expiresAt) > now;
}

export const quoteErrors: Record<QuoteErrorCode, string> = {
  NO_ROUTE: "LI.FI belum menemukan rute untuk nominal ini. Coba nominal lain.",
  TIMEOUT: "LI.FI belum merespons tepat waktu. Coba minta estimasi lagi.",
  RATE_LIMITED: "Terlalu banyak permintaan ke LI.FI. Tunggu sebentar lalu coba lagi.",
  UPSTREAM_ERROR: "Estimasi dari LI.FI belum bisa ditampilkan. Coba lagi.",
  BUSY: "Layanan estimasi sedang sibuk. Coba lagi sebentar.",
};
