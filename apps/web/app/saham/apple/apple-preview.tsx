"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  apple, appleIssuerProfiles, tokenRegistry, type AppleIssuerEvaluation, type AppleIssuerSelection,
  type AppleQuotesResponse, type QuoteAmount, type QuoteFee,
} from "@1stocks/shared";
import { formatAtomic, isCurrentQuote, quoteErrors, readRupiah, type QuotedApple } from "./quote-display";
import { SignInControl } from "../../wallet/account";
import { useWalletSession } from "../../wallet/session";
import { canPreviewApple } from "../../wallet/session-policy";
import styles from "./preview.module.css";

const presets = [
  { value: "100000", label: "100 rb" },
  { value: "500000", label: "500 rb" },
  { value: "1000000", label: "1 jt" },
  { value: "5000000", label: "5 jt" },
];
const time = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", second: "2-digit",
});
const formatTime = (iso: string) => `${time.format(new Date(iso))} WIB`;
const rupiah = (amount: string) => `Rp${formatAtomic(amount, 0)}`;
const quantity = ({ amountAtomic, decimals, symbol }: QuoteAmount<string>) =>
  `${formatAtomic(amountAtomic, decimals)} ${symbol}`;
const minimum = (quote: QuotedApple) => quantity({ ...quote.output, amountAtomic: quote.minimumOutputAtomic });
const route = (quote: QuotedApple) => quote.router ? `LI.FI via ${quote.router}` : "LI.FI";
const costPerShare = (value: string) => formatAtomic(value.replace(".", ""), 2);
const feeNames = new Map([
  ["LIFI Fixed Fee", "Biaya LI.FI"],
  ["Rent Exemption Deposit", "Setoran akun token Solana"],
  ["SEND", "Biaya kirim jaringan"],
]);

type QuoteSet = { amount: string; data: AppleQuotesResponse };
type Review = { set: QuoteSet; quote: QuotedApple };
type Step =
  | { name: "detail"; offer?: QuoteSet }
  | { name: "compare"; set: QuoteSet; selected: QuotedApple | null }
  | { name: "review" | "result"; review: Review };

const gapLabels = {
  ELIGIBILITY_UNVERIFIED: "Kelayakan pengguna belum diverifikasi",
  EXPOSURE_UNVERIFIED: "Normalisasi eksposur belum terverifikasi",
  COST_INCOMPLETE: "Biaya total dalam IDRX belum terverifikasi",
};

function describeDecision(decision: AppleIssuerSelection["decision"]) {
  if (decision.status === "recommended") return {
    title: "Rekomendasi untuk nominal ini",
    detail: "Biaya untuk eksposur yang setara lebih rendah, termasuk pada batas minimum diterima.",
  };
  if (decision.status === "only_quotable") return {
    title: "Satu penawaran tersedia",
    detail: "Hanya satu produk punya penawaran yang masih berlaku. Kelayakan pengguna mengikuti ketentuan penerbit.",
  };
  const messages = {
    NO_FRESH_ROUTES: { title: "Penawaran belum tersedia", detail: "Lihat alasan per penerbit, perbarui estimasi, atau ubah nominal." },
    MISSING_COMPARISON_DATA: { title: "Rekomendasi belum tersedia", detail: "1Stocks belum bisa memastikan kesetaraan eksposur, kelayakan, dan biaya total untuk semua penawaran ini." },
    INCOMPARABLE_PRODUCTS: { title: "Rekomendasi belum tersedia", detail: "Produk yang tersedia tidak memiliki dasar perbandingan eksposur yang setara." },
    COST_TIE: { title: "Biaya estimasi setara", detail: "Perbandingan biaya untuk nominal ini tidak menghasilkan satu pilihan." },
    COST_RANGES_OVERLAP: { title: "Rentang biaya tumpang tindih", detail: "Pilihan dengan estimasi terendah dapat berubah pada batas minimum diterima." },
  };
  return messages[decision.reason];
}

function explainExclusion(reason: Extract<AppleIssuerEvaluation, { status: "excluded" }>["reason"]) {
  switch (reason) {
    case "UNSUPPORTED_SOLANA": return "Di luar cakupan demo. AAPLB tidak terdaftar pada Solana untuk 1Stocks.";
    case "PRODUCT_RESTRICTED": return "Ketentuan penerbit mengecualikan produk ini untuk profil pengguna.";
    case "QUOTE_EXPIRED": return "Estimasi kedaluwarsa.";
    default: return quoteErrors[reason];
  }
}

function findQuote(set: QuoteSet, quoteId: string, token: QuotedApple["token"]) {
  return set.data.quotes.find((quote): quote is QuotedApple =>
    quote.status === "quoted" && quote.token === token && quote.quoteId === quoteId);
}

function summarizeOffer(set: QuoteSet, now: number): { title: string; detail: string; quote?: QuotedApple } {
  const { decision, candidates } = set.data.selection;
  if (decision.status === "recommended" && !candidates.every((candidate) =>
    candidate.status === "excluded" || isCurrentCandidate(set, candidate, now))) {
    return { title: "Perbandingan kedaluwarsa", detail: "Perbarui estimasi untuk mengevaluasi penerbit lagi." };
  }
  if (decision.status !== "unavailable") {
    const quote = findQuote(set, decision.quoteId, decision.token);
    if (quote && isCurrentQuote(quote, now)) return { ...describeDecision(decision), quote };
    return { title: "Estimasi kedaluwarsa", detail: "Perbarui estimasi untuk melanjutkan." };
  }
  const quotable = candidates.filter((candidate) => candidate.status === "quotable");
  if (quotable.length && !quotable.some((candidate) => isCurrentCandidate(set, candidate, now))) {
    return { title: "Estimasi kedaluwarsa", detail: "Perbarui estimasi untuk melihat penawaran terbaru." };
  }
  return describeDecision(decision);
}

function isCurrentCandidate(set: QuoteSet, candidate: Extract<AppleIssuerEvaluation, { status: "quotable" }>, now: number) {
  const quote = findQuote(set, candidate.quoteId, candidate.token);
  return quote !== undefined && isCurrentQuote(quote, now);
}

function Fees({ title, costs }: { title: string; costs: QuoteFee[] }) {
  return (
    <div className={styles.fees}>
      <h3>{title}</h3>
      {costs.length === 0 ? <p>Tidak dirinci oleh LI.FI.</p> : (
        <dl className={styles.lines}>
          {costs.map((fee, index) => (
            <div key={index}>
              <dt>
                {feeNames.get(fee.name) ?? fee.name}
                <small>{fee.included === undefined ? "Status biaya tidak dirinci" : fee.included ? "Sudah termasuk dalam estimasi" : "Di luar estimasi"}</small>
              </dt>
              <dd className={styles.figure}>{quantity(fee.amount)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function IssuerTerms({ set }: { set: QuoteSet }) {
  const columns = apple.buyTokens.map((token) => {
    const candidate = set.data.selection.candidates.find((entry) => entry.token === token);
    const quotable = candidate?.status === "quotable" ? candidate : undefined;
    return {
      token, profile: appleIssuerProfiles[token], evaluation: quotable,
      quote: quotable ? findQuote(set, quotable.quoteId, token) : undefined,
    };
  });
  const terms = [
    { field: "instrument", label: "Instrumen" },
    { field: "dividendTreatment", label: "Dividen" },
    { field: "restriction", label: "Ketentuan" },
  ] as const;

  return (
    <section className={styles.panel} aria-labelledby="issuer-terms">
      <h2 id="issuer-terms">Syarat tiap penerbit</h2>
      <table className={styles.issuerTerms}>
        <thead><tr>
          <th scope="col"><span className="sr-only">Jenis informasi</span></th>
          {columns.map(({ token }) => <th scope="col" key={token}>{token}<small>{tokenRegistry[token].issuer}</small></th>)}
        </tr></thead>
        <tbody>
          {terms.map(({ field, label }) => (
            <tr key={field}><th scope="row">{label}</th>{columns.map(({ token, profile }) => <td key={token}>{profile[field]}</td>)}</tr>
          ))}
          <tr>
            <th scope="row">Dasar perbandingan biaya</th>
            {columns.map(({ token, evaluation, quote }) => (
              <td key={token}>
                {evaluation?.costPerShare
                  ? <p>{costPerShare(evaluation.costPerShare.estimated)} IDRX per eksposur satu saham. Pada minimum diterima {costPerShare(evaluation.costPerShare.atMinimumReceived)} IDRX.</p>
                  : evaluation && evaluation.gaps.length
                    ? <ul>{evaluation.gaps.map((gap) => <li key={gap}>{gapLabels[gap]}</li>)}</ul>
                    : <p>{quote ? "Evaluasi biaya memerlukan perbandingan dengan produk lain." : "Penawaran belum tersedia."}</p>}
                {quote && (
                  <details className={styles.resultFees}>
                    <summary>Biaya penawaran {token}</summary>
                    <Fees title="Biaya rute" costs={quote.feeCosts} />
                    <Fees title="Biaya jaringan" costs={quote.gasCosts} />
                  </details>
                )}
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">Dokumen</th>
            {columns.map(({ token, profile }) => <td key={token}><a href={profile.documentUrl} target="_blank" rel="noreferrer">Dokumen {token} ↗</a></td>)}
          </tr>
        </tbody>
      </table>
    </section>
  );
}

export function ApplePreview() {
  const session = useWalletSession();
  const sessionKey = session.status === "signed-in" ? session.userId : session.status;
  return <ApplePurchase key={sessionKey} canQuote={canPreviewApple(session.status)} />;
}

function ApplePurchase({ canQuote }: { canQuote: boolean }) {
  const [amount, setAmount] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [step, setStep] = useState<Step>({ name: "detail" });
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState("");
  const [quoteNow, setQuoteNow] = useState(0);
  const request = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const parsed = readRupiah(amount);
  const invalid = (showValidation || amount.length > 0) && parsed === null;
  const offer = step.name === "detail" ? step.offer : undefined;
  const activeSet = step.name === "compare" ? step.set : step.name === "review" ? step.review.set : offer;
  const offerSummary = offer ? summarizeOffer(offer, quoteNow) : null;
  const comparison = step.name === "compare" ? step : null;
  const comparisonSummary = comparison ? summarizeOffer(comparison.set, quoteNow) : null;
  const review = step.name === "review" ? step.review : null;
  const reviewCurrent = review !== null && isCurrentQuote(review.quote, quoteNow);

  useEffect(() => () => request.current?.abort(), []);

  useEffect(() => {
    if (!activeSet) return;
    const timers = activeSet.data.quotes.flatMap((quote) => {
      if (quote.status !== "quoted") return [];
      return [window.setTimeout(() => setQuoteNow(Date.now()), Math.max(0, Date.parse(quote.expiresAt) - Date.now() + 5))];
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [activeSet]);

  useEffect(() => {
    if (step.name !== "detail") heading.current?.focus();
  }, [step.name]);

  function cancelRequest() {
    request.current?.abort();
    request.current = null;
    setBusy(false);
  }

  function editAmount(next: string) {
    cancelRequest();
    setApiError("");
    setAmount(next);
    setStep({ name: "detail" });
  }

  function backToDetail() {
    cancelRequest();
    setApiError("");
    setStep({ name: "detail" });
    window.requestAnimationFrame(() => input.current?.focus());
  }

  async function loadQuotes(nominal: string, destination: "detail" | "compare" = "detail") {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setApiError("");
    try {
      const query = new URLSearchParams({ amountIdrx: nominal });
      const timeout = AbortSignal.timeout(12_000);
      const signal = AbortSignal.any([controller.signal, timeout]);
      const response = await fetch(`/api/quotes/apple?${query}`, { signal, cache: "no-store" });
      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        if (request.current !== controller || controller.signal.aborted) return;
        setApiError(problem?.code === "QUOTE_NOT_CONFIGURED" ? "Layanan estimasi LI.FI belum terhubung."
            : problem?.code === "INVALID_AMOUNT" ? "Periksa kembali nominal rupiah."
              : response.status === 429 ? quoteErrors.RATE_LIMITED : quoteErrors.UPSTREAM_ERROR);
        return;
      }
      const data: AppleQuotesResponse = await response.json();
      if (request.current !== controller || controller.signal.aborted) return;
      const now = Date.now();
      setQuoteNow(now);
      const set = { amount: nominal, data };
      setStep(destination === "compare"
        ? { name: "compare", set, selected: summarizeOffer(set, now).quote ?? null }
        : { name: "detail", offer: set });
    } catch (error) {
      if (request.current !== controller || controller.signal.aborted) return;
      setApiError(error instanceof DOMException && error.name === "TimeoutError"
        ? quoteErrors.TIMEOUT : "Estimasi belum bisa dimuat. Coba minta estimasi lagi.");
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  function submitAmount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowValidation(true);
    if (parsed) void loadQuotes(parsed);
    else input.current?.focus();
  }

  function validForReview(quote: QuotedApple, now: number) {
    setQuoteNow(now);
    return !request.current && isCurrentQuote(quote, now);
  }

  function reviewOffer(set: QuoteSet) {
    const now = Date.now();
    const quote = summarizeOffer(set, now).quote;
    if (quote && validForReview(quote, now)) setStep({ name: "review", review: { set, quote } });
    else setQuoteNow(now);
  }

  return (
    <div className={styles.main} aria-busy={busy}>
    {step.name === "detail" && (
      <div className={styles.detailGrid}>
        <header className={styles.assetHeading}>
          <Link href="/pasar" className="mb-2 inline-block text-sm text-landing-muted hover:text-landing-accent">← Pasar</Link>
          <h1>Apple Inc.</h1>
          <p>{apple.ticker} · {apple.buyTokens.length} produk token saham</p>
        </header>

          <div className={`${styles.assetPanels} ${styles.stockPanels}`}>
            <figure className="m-0 grid gap-3 border-b border-solid border-landing-border pb-5">
              <Image src="/app-ui/apple-chart.svg" alt="" width={820} height={260} className="block h-auto max-w-full" unoptimized />
              <figcaption className="text-xs text-landing-muted">Ilustrasi grafik. Harga referensi belum tersedia.</figcaption>
            </figure>
            <section className="grid gap-3 border-b border-solid border-landing-border pb-5" aria-labelledby="apple-terms">
              <h2 id="apple-terms">Tentang token Apple</h2>
              <p className="text-landing-muted">1Stocks memeriksa penawaran xStocks dan Ondo untuk nominal yang kamu masukkan. Ketentuan hukum, hak pemegang, dan risiko mengikuti dokumen masing-masing penerbit.</p>
              <div className={styles.termsLinks}>
                {apple.buyTokens.map((token) => <a key={token} href={appleIssuerProfiles[token].documentUrl} target="_blank" rel="noreferrer">{token} <span aria-hidden="true">↗</span></a>)}
              </div>
            </section>
            <section className="grid gap-3" aria-labelledby="apple-market">
              <h2 id="apple-market">Ringkasan Apple</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
                <div><dt className="text-landing-muted">Saham acuan</dt><dd>Apple Inc. (AAPL)</dd></div>
                <div><dt className="text-landing-muted">Produk yang dievaluasi</dt><dd>AAPLx dan AAPLon</dd></div>
                <div><dt className="text-landing-muted">Produk di luar cakupan</dt><dd>AAPLB</dd></div>
              </dl>
            </section>
          </div>

          <div className={`${styles.assetPanels} ${styles.buyPanel}`}>
          {!canQuote && (
            <section className={`${styles.panel} ${styles.buy}`} aria-label="Akses pratinjau Apple">
              <TradingHeader />
              <SignInControl className={styles.primary} />
            </section>
          )}
          {canQuote && <form className={`${styles.panel} ${styles.buy}`} onSubmit={submitAmount} noValidate>
            <TradingHeader />
            <label htmlFor="apple-amount">Jumlah (rupiah)</label>
            <div className={styles.amountField} data-invalid={invalid || undefined}>
              <span aria-hidden="true">Rp</span>
              <input
                id="apple-amount" ref={input} inputMode="numeric" autoComplete="off" maxLength={15}
                placeholder="0" value={amount} onChange={(event) => editAmount(event.target.value)}
                onBlur={() => { if (parsed) setAmount(formatAtomic(parsed, 0)); }}
                aria-invalid={invalid} aria-describedby="amount-help"
              />
            </div>
            <div className={styles.presets} role="group" aria-label="Pilihan nominal">
              {presets.map(({ value, label }) => (
                <button type="button" key={value} aria-label={rupiah(value)} aria-pressed={parsed === value} onClick={() => editAmount(formatAtomic(value, 0))}>
                  {label}
                </button>
              ))}
            </div>
            {invalid && <p className={styles.error} role="alert">Masukkan nominal rupiah bulat mulai Rp1, hingga 12 digit.</p>}
            <p className={styles.amountHelp} id="amount-help">Kamu bisa melihat penawaran tanpa menggunakan saldo rupiah.</p>
            {apiError && <p className={styles.error} role="alert">{apiError}</p>}
            <button className={offer ? styles.secondary : styles.primary} type="submit" disabled={busy}>
              {busy ? "Memeriksa penawaran penerbit…" : offer ? "Perbarui estimasi" : "Lihat estimasi"}
            </button>
            {busy && <span className="sr-only" role="status">Meminta penawaran token Apple.</span>}
          </form>}
          {offer && offerSummary && (
            <section className={`${styles.panel} ${styles.offer}`} aria-label="Hasil evaluasi penerbit" aria-live="polite">
              <h2>{offerSummary.title}</h2>
              <p>{offerSummary.detail}</p>
              {offerSummary.quote && (
                <dl className={styles.lines}>
                  <div><dt>Penerbit</dt><dd>{tokenRegistry[offerSummary.quote.token].issuer}</dd></div>
                  <div><dt>Estimasi diterima</dt><dd className={styles.figure}>{quantity(offerSummary.quote.output)}</dd></div>
                </dl>
              )}
              {offerSummary.quote && <button className={styles.primary} type="button" disabled={busy} onClick={() => reviewOffer(offer)}>Tinjau estimasi</button>}
              <button className={offerSummary.quote ? styles.secondary : styles.primary} type="button" disabled={busy} onClick={() => {
                setApiError("");
                setStep({ name: "compare", set: offer, selected: offerSummary.quote ?? null });
              }}>Lihat perbandingan penerbit</button>
            </section>
          )}
          </div>
      </div>
    )}

    {comparison && comparisonSummary && (
        <section className={styles.compare}>
          <button type="button" className={styles.back} onClick={backToDetail}>← Ubah nominal</button>
          <h1 tabIndex={-1} ref={heading}>Bandingkan token Apple</h1>
          <p className={styles.intro}>Penawaran seluruh penerbit memakai nominal yang sama. Ketersediaan penawaran belum memverifikasi kelayakan pengguna.</p>
          <div className={`${styles.panel} ${styles.comparisonPanel}`}>
            <div className={styles.quoteToolbar}>
              <div><span>Nominal</span><strong>{rupiah(comparison.set.amount)}</strong></div>
              <button className={styles.secondary} type="button" onClick={() => void loadQuotes(comparison.set.amount, "compare")} disabled={busy}>{busy ? "Memperbarui…" : "Perbarui estimasi"}</button>
            </div>
            <div className={styles.decision}>
              <strong>{comparisonSummary.title}</strong>
              <p>{comparisonSummary.detail}</p>
            </div>
            {apiError && <p className={styles.error} role="alert">{apiError}</p>}
            <div className={styles.tableWrap}>
              <table className={styles.quoteTable}>
                <thead>
                  <tr>
                    <th scope="col">Token dan penerbit</th>
                    <th scope="col">Estimasi diterima</th>
                    <th scope="col">Minimum diterima</th>
                    <th scope="col">Ketersediaan</th>
                    <th scope="col"><span className="sr-only">Pilih token</span></th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.set.data.selection.candidates.map((candidate) => {
                    const quote = candidate.status === "quotable" ? findQuote(comparison.set, candidate.quoteId, candidate.token) : undefined;
                    const current = quote && isCurrentQuote(quote, quoteNow);
                    const selectedHere = quote && comparison.selected?.token === quote.token;
                    return (
                      <tr key={candidate.token} data-selected={selectedHere || undefined}>
                        <th scope="row"><strong>{candidate.token}</strong><small>{tokenRegistry[candidate.token].issuer}</small></th>
                        {quote && candidate.status === "quotable" ? (
                          <>
                            <td className={styles.numeric} data-label="Estimasi diterima">{quantity(quote.output)}</td>
                            <td className={styles.numeric} data-label="Minimum diterima">{minimum(quote)}</td>
                            <td>
                              <span className={current ? styles.available : styles.expired}>{current ? `Berlaku hingga ${formatTime(quote.expiresAt)}` : "Estimasi kedaluwarsa"}</span>
                              <small>Selisih estimasi ke minimum {formatAtomic(String(candidate.receiveBufferBps), 2)}%</small>
                            </td>
                            <td><button className={styles.secondary} type="button" disabled={!current || busy} aria-pressed={selectedHere} aria-label={`Pilih ${quote.token}`} onClick={() => {
                              if (validForReview(quote, Date.now())) setStep({ ...comparison, selected: quote });
                            }}>{selectedHere ? "Dipilih" : "Pilih"}</button></td>
                          </>
                        ) : <td className={styles.unavailable} colSpan={4}>{candidate.status === "excluded" ? explainExclusion(candidate.reason) : "Estimasi belum tersedia."}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className={styles.quoteFooter}>
              <p>Estimasi dan minimum ditampilkan dalam unit masing-masing token. Rute yang tersedia tidak mengukur kedalaman likuiditas.</p>
              <button className={styles.primary} type="button" disabled={!comparison.selected || !isCurrentQuote(comparison.selected, quoteNow) || busy} onClick={() => {
                if (comparison.selected && validForReview(comparison.selected, Date.now())) {
                  setStep({ name: "review", review: { set: comparison.set, quote: comparison.selected } });
                }
              }}>Tinjau estimasi</button>
            </div>
          </div>
          <IssuerTerms set={comparison.set} />
        </section>
    )}

    {review && (
        <section className={`${styles.panel} ${styles.dialog}`}>
          <button type="button" className={styles.back} disabled={busy} onClick={() => setStep({ name: "compare", set: review.set, selected: review.quote })}>← Pilih token</button>
          <h1 tabIndex={-1} ref={heading}>Tinjau estimasi Apple</h1>
          <p>Periksa produk, jumlah token, dan biaya sebelum menyelesaikan pratinjau.</p>
          <dl className={styles.lines}>
            <div><dt>Nominal rupiah</dt><dd className={styles.figure}>{rupiah(review.set.amount)}</dd></div>
            <div><dt>Token</dt><dd>{review.quote.token}</dd></div>
            <div><dt>Penerbit</dt><dd>{tokenRegistry[review.quote.token].issuer}</dd></div>
            <div><dt>Instrumen</dt><dd>{appleIssuerProfiles[review.quote.token].instrument}</dd></div>
            <div><dt>Estimasi diterima</dt><dd className={styles.figure}><strong>{quantity(review.quote.output)}</strong></dd></div>
            <div><dt>Minimum diterima</dt><dd className={styles.figure}>{minimum(review.quote)}</dd></div>
            <div><dt>Status estimasi</dt><dd className={reviewCurrent ? styles.available : styles.expired}>{reviewCurrent ? `Berlaku hingga ${formatTime(review.quote.expiresAt)}` : "Kedaluwarsa"}</dd></div>
          </dl>
          <Fees title="Biaya rute" costs={review.quote.feeCosts} />
          <Fees title="Biaya jaringan" costs={review.quote.gasCosts} />
          <div className={styles.fees}>
            <h3>Risiko dan ketentuan</h3>
            <p>{appleIssuerProfiles[review.quote.token].restriction} Harga dapat berubah, dan produk membawa risiko penerbit.</p>
            <a href={appleIssuerProfiles[review.quote.token].documentUrl} target="_blank" rel="noreferrer">Dokumen penerbit ↗</a>
          </div>
          <details className={styles.resultFees}>
            <summary>Rincian sumber estimasi</summary>
            <p>Rute {route(review.quote)} · Solana Mainnet. Input {quantity(review.set.data.input)} memakai asumsi 1 IDRX per Rp1 nominal.</p>
          </details>
          <p className={styles.orderNote}>Biaya dihitung untuk alamat uji dan bisa berbeda untuk dompetmu. Pratinjau tidak menggunakan saldo atau mengirim token.</p>
          {!reviewCurrent && <p className={styles.error} role="alert">Estimasi kedaluwarsa. Minta estimasi baru untuk melanjutkan.</p>}
          {apiError && <p className={styles.error} role="alert">{apiError}</p>}
          <button className={styles.primary} type="button" disabled={busy} onClick={() => {
            if (!reviewCurrent) void loadQuotes(review.set.amount);
            else if (validForReview(review.quote, Date.now())) setStep({ name: "result", review });
          }}>{busy ? "Memperbarui…" : reviewCurrent ? "Selesaikan pratinjau" : "Perbarui estimasi"}</button>
        </section>
    )}

    {step.name === "result" && (
      <section className={`${styles.panel} ${styles.dialog} ${styles.result}`}>
        <span className={styles.check} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="m6 12 4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
        <h1 tabIndex={-1} ref={heading}>Pratinjau selesai</h1>
        <p>Ini ringkasan estimasi Apple. Tidak ada transaksi yang dikirim ke Solana.</p>
        <dl className={styles.lines}>
          <div><dt>Nominal rupiah</dt><dd className={styles.figure}>{rupiah(step.review.set.amount)}</dd></div>
          <div><dt>Penerbit</dt><dd>{tokenRegistry[step.review.quote.token].issuer}</dd></div>
          <div><dt>Estimasi diterima</dt><dd className={styles.figure}>{quantity(step.review.quote.output)}</dd></div>
          <div><dt>Minimum diterima</dt><dd className={styles.figure}>{minimum(step.review.quote)}</dd></div>
          <div><dt>Waktu estimasi</dt><dd>{formatTime(step.review.quote.fetchedAt)}</dd></div>
        </dl>
        <details className={styles.resultFees}>
          <summary>Rincian biaya estimasi</summary>
          <Fees title="Biaya rute" costs={step.review.quote.feeCosts} />
          <Fees title="Biaya jaringan" costs={step.review.quote.gasCosts} />
        </details>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link className={`${styles.primary} inline-flex items-center`} href="/beranda">Kembali ke Beranda</Link>
          <button className={styles.secondary} type="button" onClick={backToDetail}>Kembali ke Apple</button>
        </div>
      </section>
    )}
    </div>
  );
}

function TradingHeader() {
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-solid border-landing-border pb-3">
      <h2 className="text-landing-accent">Beli Apple</h2>
      <span className="text-xs text-landing-muted">Jual Apple · Belum tersedia</span>
    </header>
  );
}
