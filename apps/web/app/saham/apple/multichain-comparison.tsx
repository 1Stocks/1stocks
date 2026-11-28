import type { AppleFundingBasis, AppleMultichainOffer, AppleMultichainPreview, QuoteFee } from "@1stocks/shared";
import { formatAtomic } from "./quote-display";
import styles from "./preview.module.css";

const fundingLabels: Record<AppleFundingBasis, string> = {
  "solana-usdc": "Dana acuan · USDC Solana",
  "ethereum-prefunded-usdc": "Skenario terpisah · USDC tersedia di Ethereum",
  "bnb-prefunded-binance-peg-usdc": "Skenario terpisah · Binance-Peg USDC tersedia di BNB",
};
const localTime = new Intl.DateTimeFormat("id-ID", { timeStyle: "medium", timeZone: "Asia/Jakarta" });

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

type Offer = Extract<AppleMultichainOffer, { status: "quoted" }>;

function NetworkOffer({ offer }: { offer: Offer }) {
  const requirements = offer.walletRequirements;
  const exposure = offer.shareExposure;
  return (
    <li className="grid gap-2 border-t border-solid border-landing-border pt-3">
      <h4>{offer.token} · {offer.network}</h4>
      <p>{requirements.sourceWallet} → {requirements.destinationWallet} · {requirements.destinationGas === "same-chain" ? "Satu jaringan" : "Lintas jaringan"}{offer.route.tool && " · " + offer.route.tool}</p>
      <p className="wrap-anywhere">Estimasi {formatAtomic(offer.output.amountAtomic, offer.output.decimals)} {offer.token} · minimum {formatAtomic(offer.minimumOutputAtomic, offer.output.decimals)} {offer.token}</p>
      {exposure ? (
        <p className="wrap-anywhere">
          Eksposur indikatif {formatAtomic(exposure.estimateAtomic, exposure.decimals)} saham AAPL · minimum {formatAtomic(exposure.minimumAtomic, exposure.decimals)} saham.
          {" "}<a href={exposure.source} className="text-landing-accent hover:underline">Dasar normalisasi</a>
        </p>
      ) : <p>Eksposur per saham belum terverifikasi.</p>}
      <details>
        <summary className="cursor-pointer">{offer.costData === "partial" ? "Rincian biaya sebagian" : "Rincian biaya dari LI.FI"}</summary>
        <div className="mt-2 grid gap-2 text-sm">
          <p>Gas sumber dalam {requirements.sourceGasAsset}.{requirements.destinationGas === "unverified" && " Kebutuhan gas tujuan belum terverifikasi."}</p>
          <div><strong>Biaya rute</strong>{feeItems(offer.feeCosts, "fee")}</div>
          <div><strong>Estimasi gas</strong>{feeItems(offer.gasCosts, "gas")}</div>
        </div>
      </details>
    </li>
  );
}

export function AppleMultichainComparison({ preview, now }: { preview: AppleMultichainPreview; now: number }) {
  const benchmark = preview.benchmark;
  const current = benchmark && Date.parse(benchmark.expiresAt) > now;
  const quoted = preview.offers.filter(offer => offer.status === "quoted");
  const unavailable = preview.offers.filter(offer => offer.status === "unavailable");

  return (
    <section className={styles.panel} aria-labelledby="apple-multichain">
      <h2 id="apple-multichain">Estimasi lintas jaringan</h2>
      <p>Perbandingan indikatif. Peringkat ditahan sampai pendanaan, biaya all-in, dampak harga, dan eksposur setara terverifikasi.</p>
      {!benchmark ? <p>Konversi acuan IDRX ke USDC belum tersedia. Perbarui estimasi untuk mencoba lagi.</p>
        : !current ? <p>Estimasi lintas jaringan kedaluwarsa. Perbarui estimasi untuk melihat rute terbaru.</p>
        : (
          <>
            <p>Anggaran Rp{formatAtomic(benchmark.idrBudgetAtomic, 2)}. Acuan LI.FI IDRX → USDC di Solana memakai minimum {formatAtomic(benchmark.minimumUsdcAtomic, 6)} USDC pada <time dateTime={benchmark.fetchedAt}>{localTime.format(new Date(benchmark.fetchedAt))} WIB</time>.</p>
            <p>Kurs minimum indikatif {benchmark.minimumRateUsdcPerIdrx.replace(".", ",")} USDC per IDRX. Setiap skenario mengasumsikan saldo hipotetis. Dana lintas skenario belum dapat disetarakan.</p>
            {(Object.keys(fundingLabels) as AppleFundingBasis[]).map(basis => {
              const offers = quoted.filter(offer => offer.fundingBasis === basis);
              if (!offers.length) return null;
              return (
                <div key={basis} className="grid gap-3">
                  <h3>{fundingLabels[basis]}</h3>
                  <p>Pendanaan hipotetis {formatAtomic(offers[0].funding.amountAtomic, offers[0].funding.decimals)} USDC per rute.</p>
                  <ul className="m-0 grid list-none gap-4 p-0">
                    {offers.map(offer => <NetworkOffer offer={offer} key={offer.token + offer.network} />)}
                  </ul>
                </div>
              );
            })}
            {unavailable.length > 0 && (
              <div>
                <h3>Kuotasi belum tersedia</h3>
                <ul className="m-0 pl-5">
                  {unavailable.map(offer => <li key={offer.token + offer.network}>{offer.token} · {offer.network}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
    </section>
  );
}
