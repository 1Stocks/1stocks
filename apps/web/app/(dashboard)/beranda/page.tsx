import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AccountGreeting } from "../_components/account-details";
import { pageTitle, panel, primaryButton, secondaryButton } from "../_components/styles";

export const metadata: Metadata = { title: "Beranda | 1Stocks" };

export default function BerandaPage() {
  return (
    <div className="grid gap-[18px]">
      <header className="grid gap-1">
        <AccountGreeting />
        <h1 className={pageTitle}>Beranda</h1>
      </header>
      <p className="rounded-[10px] border border-solid border-landing-badge-border bg-landing-card px-4 py-3 text-sm">
        Kamu bisa membandingkan penawaran Apple dan menyelesaikan pratinjau tanpa menggunakan saldo.
      </p>

      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className={`${panel} grid min-h-80 gap-5 bg-linear-to-br from-[#26351a] via-landing-card to-landing-card`} aria-labelledby="total-aset">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid gap-1">
              <h2 id="total-aset" className="text-xs font-medium tracking-wider text-landing-muted uppercase">Total aset</h2>
              <p className="text-[24px]/8 font-semibold text-white">Belum ada aset tercatat</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/deposit" className={secondaryButton}>Deposit</Link>
              <Link href="/saham/apple" className={secondaryButton}>Beli Apple</Link>
              <Link href="/withdraw" className={secondaryButton}>Withdraw</Link>
            </div>
          </div>
          <div className="grid min-h-30 content-center gap-2 rounded-[10px] border border-dashed border-landing-border p-4">
            <p className="font-medium text-white">Jelajahi saham Apple</p>
            <p className="text-sm text-landing-muted">Coba estimasi pembelian dalam rupiah dan lihat perbandingan penerbit di Pasar.</p>
            <Link href="/pasar" className="mt-1 w-fit text-sm font-medium text-landing-accent hover:underline">Buka Pasar →</Link>
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div><dt className="text-landing-muted">Saldo rupiah</dt><dd>Belum tersedia</dd></div>
            <div><dt className="text-landing-muted">Nilai saham</dt><dd>—</dd></div>
            <div><dt className="text-landing-muted">Apple dimiliki</dt><dd>—</dd></div>
          </dl>
        </section>

        <div className="grid gap-3">
          <section className={`${panel} grid gap-4`} aria-labelledby="apple-beranda">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-[#f4f1ec] font-semibold text-landing-action">A</span>
                <div className="grid gap-0.5">
                  <h2 id="apple-beranda" className="text-[15px] font-semibold text-white">Apple</h2>
                  <p className="text-xs text-landing-muted">AAPL · Token saham</p>
                </div>
              </div>
              <figure className="m-0 grid gap-1 text-right">
                <Image src="/app-ui/home-apple-sparkline.svg" alt="" width={120} height={36} loading="eager" unoptimized />
                <figcaption className="text-[10px] text-landing-muted">Ilustrasi grafik</figcaption>
              </figure>
            </header>
            <Link href="/saham/apple" className={primaryButton}>Lihat Apple</Link>
          </section>
          <section className={`${panel} grid min-h-39 content-start gap-4`} aria-labelledby="aktivitas-terbaru">
            <header className="flex items-center justify-between gap-3">
              <h2 id="aktivitas-terbaru" className="text-[15px] font-semibold text-white">Aktivitas terbaru</h2>
              <Link href="/riwayat" className="text-sm text-landing-ondo hover:underline">Semua</Link>
            </header>
            <p className="text-sm text-landing-muted">Belum ada transaksi.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
