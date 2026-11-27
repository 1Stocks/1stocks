import type { Metadata } from "next";
import Link from "next/link";
import { PortfolioWallet } from "../_components/account-details";
import { pageTitle, panel, primaryButton } from "../_components/styles";

export const metadata: Metadata = { title: "Portofolio | 1Stocks" };

export default function PortfolioPage() {
  return (
    <div className="grid gap-[18px]">
      <h1 className={pageTitle}>Portofolio</h1>
      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <section className={`${panel} grid min-h-56 content-center justify-items-start gap-3`} aria-labelledby="aset-saham">
          <h2 id="aset-saham" className="text-lg font-semibold text-white">Belum ada aset saham tercatat</h2>
          <p className="text-sm text-landing-muted">Dalam demo ini, estimasi Apple tidak menambah kepemilikan saham.</p>
          <Link href="/pasar" className={primaryButton}>Jelajahi Pasar</Link>
        </section>
        <section className={`${panel} grid justify-items-start gap-3 text-sm`} aria-labelledby="dompet-portofolio">
          <h2 id="dompet-portofolio" className="text-base font-semibold text-white">Dompet Solana</h2>
          <PortfolioWallet />
        </section>
      </div>
    </div>
  );
}
