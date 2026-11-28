import type { AppleMultichainPreview, QuoteFee } from "@1stocks/shared";
import { formatAtomic } from "./quote-display";
import styles from "./preview.module.css";

const fundingLabels = {
  "solana-usdc": "USDC Solana",
  "ethereum-prefunded-usdc": "USDC Ethereum yang sudah tersedia",
  "bnb-prefunded-binance-peg-usdc": "Binance-Peg USDC BNB yang sudah tersedia",
};

function feeItems(items: QuoteFee[], kind: "fee" | "gas") {
  if (!items.length) return <p>Belum dirinci.</p>;
  return (
    <ul className="m-0 grid gap-1 pl-5">
      {items.map((fee, index) => (
        <li key={index} className="wrap-anywhere">
          {fee.name} · {formatAtomic(fee.amount.amountAtomic, fee.amount.decimals)} {fee.amount.symbol}
          {kind === "fee" && fee.included === true && " · termasuk dalam kuotasi"}
          {kind === "fee" && fee.included === false && " · di luar kuotasi"}
        </li>
      ))}
    </ul>
  );
}

export function AppleMultichainComparison({ preview, now }: { preview: AppleMultichainPreview; now: number }) {
  const benchmark = preview.benchmark;
  const current = benchmark && Date.parse(benchmark.expiresAt) > now;

  return (
    <section className={styles.panel} aria-labelledby="apple-multichain">
      <h2 id="apple-multichain">Estimasi lintas jaringan</h2>
      <p>Perbandingan indikatif. Kelayakan produksi, eksposur saham setara, dan biaya all-in masih perlu diverifikasi.</p>
      {!benchmark ? <p>Konversi acuan IDRX ke USDC belum tersedia. Perbarui estimasi untuk mencoba lagi.</p>
        : !current ? <p>Estimasi lintas jaringan kedaluwarsa. Perbarui estimasi untuk melihat rute terbaru.</p>
        : (
          <>
            <p>Patokan per rute {formatAtomic(benchmark.comparisonUsdcAtomic, 6)} USDC.
              {benchmark.comparisonUsdcAtomic !== benchmark.minimumUsdcAtomic && " Minimum hasil konversi IDRX " + formatAtomic(benchmark.minimumUsdcAtomic, 6) + " USDC dibulatkan ke bawah untuk perbandingan."}
              {" Rute dengan dana yang sudah tersedia di jaringan lain memakai nominal token yang sama dan skenario pendanaan terpisah."}</p>
            <p>Dampak harga dan likuiditas jual belum terverifikasi dari kuotasi ini.</p>
            <ul className="m-0 grid list-none gap-4 p-0">
              {preview.offers.map(offer => (
                <li className="grid gap-2 border-t border-solid border-landing-border pt-3" key={offer.token + offer.network}>
                  <h3>{offer.token} · {offer.network}</h3>
                  {offer.status === "unavailable" ? <p>Kuotasi belum tersedia untuk nominal ini.</p> : (
                    <>
                      <p>{fundingLabels[offer.fundingBasis]} → {offer.network} · {offer.route.funding.chainId === offer.route.deployment.chainId ? "Satu jaringan" : "Lintas jaringan"}{offer.route.tool && " · " + offer.route.tool}</p>
                      <p className="wrap-anywhere">Estimasi {formatAtomic(offer.output.amountAtomic, offer.output.decimals)} {offer.token} · minimum {formatAtomic(offer.minimumOutputAtomic, offer.output.decimals)} {offer.token}</p>
                      <details>
                        <summary className="cursor-pointer">{offer.costData === "partial" ? "Rincian biaya sebagian" : "Rincian biaya dari LI.FI"}</summary>
                        <div className="mt-2 grid gap-2 text-sm">
                          <div><strong>Biaya rute</strong>{feeItems(offer.feeCosts, "fee")}</div>
                          <div><strong>Gas</strong>{feeItems(offer.gasCosts, "gas")}</div>
                        </div>
                      </details>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
    </section>
  );
}
