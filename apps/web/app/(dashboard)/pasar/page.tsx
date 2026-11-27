import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MarketSearch } from "../_components/market-search";
import { pageTitle, panel } from "../_components/styles";
import { issuers, searchCatalog } from "../../../../../packages/asset-catalog/registry/catalog";

export const metadata: Metadata = { title: "Pasar | 1Stocks" };

export default async function PasarPage({ searchParams }: {
  searchParams: Promise<{ q?: string | string[]; halaman?: string }>;
}) {
  const { q, halaman } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 80) : "";
  const results = searchCatalog(query);
  const total = Math.max(1, Math.ceil(results.length / 25));
  const index = Math.min(total, Math.max(1, Number.parseInt(halaman ?? "", 10) || 1));
  const stocks = results.slice((index - 1) * 25, index * 25);
  const href = (page: number) => `/pasar?${new URLSearchParams({ q: query, halaman: String(page) })}`;
  const headingClass = "px-2.5 pt-1 pb-2 text-xs font-medium tracking-wider text-landing-muted uppercase";
  const secondaryColumn = "hidden text-right sm:table-cell";

  return (
    <div className="grid gap-[18px]">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <h1 className={pageTitle}>Pasar</h1>
          <p className="text-sm text-landing-muted">Jelajahi token saham AS. Pratinjau pembelian tersedia untuk Apple.</p>
        </div>
        <MarketSearch key={query} id="pencarian-pasar" query={query} className="w-full sm:w-[300px]" />
      </header>
      <section aria-label="Daftar saham" className={panel}>
        {stocks.length > 0 ? (
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th scope="col" className={headingClass}>Saham</th>
                <th scope="col" className={`${headingClass} ${secondaryColumn}`}>Harga</th>
                <th scope="col" className={`${headingClass} ${secondaryColumn}`}>24 jam</th>
                <th scope="col" className={`${headingClass} hidden md:table-cell`}>Grafik</th>
                <th scope="col" className={`${headingClass} text-right`}>Penerbit</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock) => {
                const available = stock.id === "us0378331005";
                const issuerNames = [...new Set(stock.products.map(product => issuers[product.issuer].name))].join(", ");
                const label = (
                  <>
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f4f1ec] text-xs font-semibold text-landing-action">{stock.name[0]}</span>
                    <span>{stock.name} <span className="block text-xs text-landing-muted sm:ml-1 sm:inline">{stock.ticker}</span></span>
                  </>
                );
                return (
                  <tr key={stock.id} className="border-t border-solid border-landing-border">
                    <th scope="row" className="py-2.5 pr-2 text-[13px] font-semibold sm:px-2.5">
                      <Link href={available ? "/saham/apple" : `/saham/${encodeURIComponent(stock.id)}`} className="inline-flex min-h-9 items-center gap-2 hover:text-landing-accent">{label}</Link>
                    </th>
                    <td className={`${secondaryColumn} px-2.5 text-landing-muted`}><span aria-label="Harga belum tersedia">—</span></td>
                    <td className={`${secondaryColumn} px-2.5 text-landing-muted`}><span aria-label="Perubahan belum tersedia">—</span></td>
                    <td className="hidden px-2.5 md:table-cell">
                      {available && (
                        <figure className="m-0 w-fit">
                          <Image src="/app-ui/market-apple-sparkline.svg" alt="" width={90} height={28} unoptimized />
                          <figcaption className="text-[10px] text-landing-muted">Ilustrasi</figcaption>
                        </figure>
                      )}
                    </td>
                    <td className="text-right sm:px-2.5">
                      <span className={`inline-block rounded-md border border-solid px-2 py-0.5 text-xs ${available
                        ? "border-[#573b23] bg-[#322112] text-landing-ondo"
                        : "border-landing-border bg-landing-badge text-landing-muted"}`}>
                        {issuerNames}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="grid min-h-36 content-center justify-items-center gap-2 text-center">
            <h2 className="max-w-full text-base font-semibold wrap-anywhere">Tidak ada hasil untuk “{query}”</h2>
            <p className="text-sm text-landing-muted">Coba cari Apple atau AAPL.</p>
            <Link href="/pasar" className="mt-2 text-sm font-medium text-landing-accent hover:underline">Tampilkan semua saham</Link>
          </div>
        )}
      </section>
      {total > 1 && <nav aria-label="Halaman katalog" className="flex gap-4 text-sm">
        {index > 1 && <Link href={href(index - 1)} className="text-landing-accent">← Sebelumnya</Link>}
        <span>Halaman {index} / {total}</span>
        {index < total && <Link href={href(index + 1)} className="text-landing-accent">Berikutnya →</Link>}
      </nav>}
      <p className="text-xs text-landing-muted">Estimasi aktual tersedia di halaman Apple setelah kamu memasukkan nominal.</p>
    </div>
  );
}
