import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { LandingEntry } from "./landing/entry";
import { LandingInformation } from "./landing/information";

const inter = localFont({
  src: "./landing/InterVariable.woff2",
  weight: "100 900",
  display: "swap",
});

const contentWidth = "mx-auto w-full max-w-[90rem] px-5 sm:px-8 lg:px-16 xl:px-25";

function MarketSnapshot() {
  return (
    <section
      aria-labelledby="apple-snapshot"
      className="grid gap-4 rounded-2xl border border-solid border-landing-border bg-landing-card px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:h-30 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)_minmax(0,1fr)] lg:items-center lg:gap-6 lg:px-7 lg:py-0"
    >
      <div className="grid gap-1 lg:justify-self-start">
        <h2 id="apple-snapshot" className="text-[11px]/[18px] font-normal text-landing-muted">APPLE INC. (AAPL)</h2>
        <p className="text-[28px]/10 font-semibold text-white">Rp5.857.470</p>
        <p className="text-xs/[18px] text-landing-accent">+0,91% · Harga simulasi</p>
      </div>

      <Image
        src="/landing/apple-sparkline.svg"
        width={360}
        height={64}
        alt=""
        className="block h-auto max-w-full justify-self-center lg:-translate-x-2"
        unoptimized
      />

      <dl aria-label="Perbandingan simulasi token Apple" className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-5 gap-y-1.5 text-xs/[18px] sm:col-span-2 lg:col-span-1 lg:justify-self-end">
        <dt className="text-landing-muted">AAPLB</dt>
        <dd className="text-right text-[13px]/5 text-landing-muted">Tidak tersedia</dd>
        <dt className="text-landing-muted">AAPLx · xStocks</dt>
        <dd className="text-right text-[13px]/5 font-medium">Rp5.907.326</dd>
        <dt className="text-landing-muted">AAPLon · Ondo</dt>
        <dd className="text-right text-[13px]/5 font-medium text-landing-ondo">Rp5.915.859</dd>
      </dl>
    </section>
  );
}

export default function Home() {
  return (
    <div className={`${inter.className} landing-page min-h-svh bg-landing-canvas text-landing-text scheme-dark`}>
      <a href="#utama" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-10 focus:bg-landing-accent focus:p-3 focus:text-landing-action">
        Ke konten utama
      </a>
      <header className={`${contentWidth} pt-6 lg:pt-9`}>
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-4 lg:h-11 lg:grid-cols-[1fr_auto_auto] lg:gap-7">
          <Link href="/" className="col-start-1 row-start-1 flex w-fit items-center gap-2.5 text-[19px]/8 font-semibold text-white">
            <Image src="/landing/brand-mark.svg" alt="" width={22} height={22} unoptimized />
            OneStocks
          </Link>
          <nav aria-label="Navigasi utama" className="col-span-2 col-start-1 row-start-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm/5 font-medium lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:gap-7">
            <Link href="/pasar" className="hover:text-landing-accent">Pasar</Link>
            <a href="#cara-kerja" className="hover:text-landing-accent">Cara kerja</a>
            <a href="#disclaimer" className="text-landing-muted hover:text-landing-accent">Disclaimer</a>
          </nav>
          <div className="col-start-2 row-start-1 justify-self-end lg:col-start-3">
            <LandingEntry compact />
          </div>
        </div>
      </header>

      <main id="utama" tabIndex={-1}>
        <div className={`${contentWidth} flex flex-col gap-12 pt-14 pb-8 lg:min-h-[calc(100svh-5rem)] lg:gap-0 lg:pt-0 lg:pb-11`}>
          <section id="mulai" tabIndex={-1} aria-labelledby="judul-landing" className="flex scroll-mt-6 flex-col items-center gap-5 text-center lg:my-auto lg:min-h-[353px]">
            <p className="rounded-full border border-solid border-landing-badge-border bg-landing-badge px-3.5 py-1.5 text-xs/[18px] text-landing-accent">
              Pratinjau saham AS · Simulasi dengan rupiah
            </p>
            <h1 id="judul-landing" className="max-w-[820px] text-4xl/10 font-semibold text-balance text-white [font-optical-sizing:none] lg:text-[56px]/16">
              <span className="lg:block">Investasi saham AS,</span>{" "}
              <span className="lg:block">semuanya di satu tempat.</span>
            </h1>
            <p className="max-w-[640px] text-base/6 lg:text-[17px]/[26px]">
              Simulasikan pembelian token saham Apple dengan rupiah. OneStocks membandingkan estimasi dari xStocks dan Ondo.
            </p>
            <div className="flex w-full flex-col items-center gap-3.5 sm:w-auto sm:flex-row sm:items-start">
              <div className="grid w-full justify-items-center gap-2 text-sm sm:w-[220px]">
                <LandingEntry />
              </div>
              <Link href="/saham/apple" className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-solid border-landing-border bg-landing-card px-4 text-[15px]/5 font-medium text-landing-text hover:border-landing-accent sm:w-[150px]">
                Lihat estimasi
              </Link>
            </div>
          </section>
          <MarketSnapshot />
        </div>
        <div className={contentWidth}>
          <LandingInformation />
        </div>
      </main>
    </div>
  );
}
