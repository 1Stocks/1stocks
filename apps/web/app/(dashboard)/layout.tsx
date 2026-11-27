import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import { AccountMenu } from "../wallet/account";
import { AppNavigation } from "./_components/navigation";
import { MarketSearch } from "./_components/market-search";
import { primaryButton, secondaryButton } from "./_components/styles";

const inter = localFont({
  src: "../landing/InterVariable.woff2",
  weight: "100 900",
  display: "swap",
});

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${inter.className} dashboard grid min-h-svh bg-landing-canvas text-landing-text scheme-dark lg:grid-cols-[232px_minmax(0,1fr)]`}>
      <a href="#konten-aplikasi" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-20 focus:bg-landing-accent focus:p-3 focus:text-landing-action">
        Ke konten utama
      </a>
      <aside className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-solid border-landing-border bg-[#100e0d] p-3 lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:items-stretch lg:gap-3 lg:border-r lg:border-b-0 lg:p-3.5">
        <Link href="/beranda" aria-label="1Stocks, Beranda" className="col-start-1 row-start-1 flex w-fit items-center gap-2.5 px-2 py-2 text-lg font-semibold lg:py-2.5">
          <Image src="/app-ui/brand.svg" alt="" width={26} height={26} unoptimized />
          One<span className="text-landing-accent">Stocks</span>
        </Link>
        <AppNavigation />
        <div className="col-start-2 row-start-1 lg:mt-auto">
          <AccountMenu buttonClass={secondaryButton} />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex flex-wrap items-center gap-2.5 border-b border-solid border-landing-border px-4 py-2.5 sm:flex-nowrap sm:px-6">
          <MarketSearch id="pencarian-global" className="min-w-40 flex-1 sm:max-w-[380px]" />
          <span className="mr-auto hidden rounded-full border border-solid border-landing-border bg-landing-card px-3 py-1 text-xs text-landing-muted md:inline">
            Pratinjau pembelian
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <details className="relative">
              <summary aria-label="Notifikasi" className="grid min-h-10 w-10 cursor-pointer list-none place-items-center rounded-[10px] border border-solid border-landing-border bg-landing-card hover:bg-landing-badge">
                <Image src="/app-ui/notification.svg" alt="" width={18} height={18} unoptimized />
              </summary>
              <p className="absolute top-full right-0 z-10 mt-2 w-48 rounded-[10px] border border-solid border-landing-border bg-landing-card p-3 text-sm shadow-lg">
                Belum ada notifikasi.
              </p>
            </details>
            <Link href="/deposit" className={`${primaryButton} min-h-10!`}>Deposit</Link>
          </div>
        </header>
        <div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-1 border-b border-solid border-landing-border px-4 py-1.5 text-xs sm:px-6">
          <Link href="/saham/apple" className="font-medium hover:text-landing-accent">AAPL</Link>
          <span className="text-landing-accent">Pratinjau tersedia</span>
          <Link href="/pasar" className="ml-auto text-landing-muted hover:text-landing-accent">Lihat pasar →</Link>
        </div>
        <main id="konten-aplikasi" tabIndex={-1} className="mx-auto w-full max-w-[1550px] px-4 pt-6 pb-12 outline-none sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
