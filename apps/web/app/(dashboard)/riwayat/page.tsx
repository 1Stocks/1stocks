import type { Metadata } from "next";
import Link from "next/link";
import { pageTitle, panel, secondaryButton } from "../_components/styles";

export const metadata: Metadata = { title: "Riwayat | 1Stocks" };

const filters = [
  { value: "semua", label: "Semua" },
  { value: "beli", label: "Beli" },
  { value: "jual", label: "Jual" },
  { value: "deposit", label: "Deposit" },
  { value: "withdraw", label: "Withdraw" },
  { value: "dividen", label: "Dividen" },
] as const;

export default async function HistoryPage({ searchParams }: {
  searchParams: Promise<{ jenis?: string | string[] }>;
}) {
  const { jenis } = await searchParams;
  const active = filters.find(({ value }) => value === jenis) ?? filters[0];

  return (
    <div className="grid gap-[18px]">
      <h1 className={pageTitle}>Riwayat</h1>
      <nav aria-label="Filter riwayat" className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <Link href={value === "semua" ? "/riwayat" : `/riwayat?jenis=${value}`} key={value}
            aria-current={value === active.value ? "page" : undefined}
            className={`${secondaryButton} aria-[current]:border-landing-accent aria-[current]:text-landing-accent`}>
            {label}
          </Link>
        ))}
      </nav>
      <section className={`${panel} grid min-h-48 content-center justify-items-center gap-2 text-center`}>
        <h2 className="text-lg font-semibold text-white">{active.value === "semua" ? "Belum ada transaksi" : `Belum ada transaksi ${active.label.toLowerCase()}`}</h2>
        <p className="text-sm text-landing-muted">Pratinjau estimasi tidak tercatat sebagai transaksi.</p>
      </section>
    </div>
  );
}
