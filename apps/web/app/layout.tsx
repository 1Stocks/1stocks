import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { Inter, JetBrains_Mono, Sora } from "next/font/google";
import { PrivySessionProvider } from "./wallet/privy-session-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-sora",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

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
    <html
      lang="id"
      className={`dark ${inter.variable} ${sora.variable} ${jetbrainsMono.variable}`}
    >
      <body className={privyFont.variable}>
        <PrivySessionProvider>{children}</PrivySessionProvider>
      </body>
    </html>
  );
}
