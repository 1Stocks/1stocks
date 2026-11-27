import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "1Stocks | Beli token saham pakai rupiah",
  description: "Coba estimasi pembelian token saham Apple dari rupiah di 1Stocks.",
  icons: { icon: { url: "/brand/favicon.svg", type: "image/svg+xml" } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
