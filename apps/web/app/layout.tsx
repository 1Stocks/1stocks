import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { PrivySessionProvider } from "./wallet/privy-session-provider";
import "./globals.css";

const privyFont = localFont({
  src: "./landing/InterVariable.woff2",
  weight: "100 900",
  display: "swap",
  variable: "--font-1stocks-privy",
});

export const metadata: Metadata = {
  title: "1Stocks | Beli token saham pakai rupiah",
  description: "Coba estimasi pembelian token saham Apple dari rupiah di 1Stocks.",
  icons: { icon: { url: "/brand/favicon.svg", type: "image/svg+xml" } },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className={privyFont.variable}>
        <PrivySessionProvider>{children}</PrivySessionProvider>
      </body>
    </html>
  );
}
