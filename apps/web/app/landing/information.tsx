import Link from "next/link";
import { LegacyCalculator } from "../legacy-calculator";

const steps = [
  "Buka halaman Apple dan masukkan nominal rupiah.",
  "Bandingkan estimasi AAPLx dan AAPLon beserta biaya dan ketentuan penerbit.",
  "Tinjau penawaran dan selesaikan pratinjau.",
];

const presets = [
  [100000, "Rp100.000"],
  [250000, "Rp250.000"],
  [500000, "Rp500.000"],
] as const;

const sampleAction =
  "min-h-11 cursor-pointer rounded-full border-0 bg-landing-accent px-5 text-sm font-medium text-landing-action hover:bg-landing-accent-hover disabled:cursor-default disabled:opacity-60";

function SampleCalculator() {
  return (
    <details id="estimasi" className="mt-7 rounded-2xl border border-solid border-landing-border bg-landing-card">
      <summary className="cursor-pointer px-5 py-4 font-medium text-white">Coba kalkulator dengan harga contoh</summary>
      <div className="grid max-w-xl gap-4 px-5 pb-5">
        <header>
          <h3 id="order-title" className="text-lg font-semibold text-white">Contoh kalkulator Apple</h3>
          <p className="mt-1 text-sm text-landing-muted">Simulasi dengan harga Rp4.000.000 per token.</p>
        </header>

        <form id="estimate-form" aria-labelledby="order-title" className="grid gap-3">
          <label htmlFor="nominal" className="text-sm">Nominal rupiah</label>
          <div className="flex items-center gap-2 rounded-xl border border-solid border-landing-border bg-landing-canvas px-3 py-2.5">
            <span aria-hidden="true">Rp</span>
            <input id="nominal" name="amount" type="text" inputMode="numeric" autoComplete="off" maxLength={12}
              defaultValue="250.000" aria-describedby="amount-help"
              className="min-w-0 flex-1 border-0 bg-transparent text-white aria-invalid:text-red-300" />
          </div>
          <p id="amount-help" className="text-sm text-red-300 empty:hidden" />
          <div role="group" aria-label="Pilihan nominal" className="flex flex-wrap gap-2">
            {presets.map(([amount, label]) => (
              <button key={amount} type="button" data-amount={amount} aria-pressed={amount === 250000}
                className="min-h-10 cursor-pointer rounded-full border border-solid border-landing-border bg-landing-canvas px-3 text-sm text-landing-text aria-pressed:border-landing-accent aria-pressed:text-landing-accent">
                {label}
              </button>
            ))}
          </div>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
            <dt>Biaya dalam nominal</dt><dd id="estimate-fee">Rp1.250</dd>
            <dt>Estimasi token diterima</dt><dd id="estimate-tokens">0,062187</dd>
          </dl>
          <button className={sampleAction} type="submit">Tinjau estimasi</button>
          <p id="estimate-live" className="sr-only" aria-live="polite" aria-atomic="true" />
        </form>

        <section id="order-review" className="grid gap-3" aria-labelledby="review-title" hidden>
          <h3 id="review-title" tabIndex={-1} className="text-lg font-semibold text-white">Tinjau estimasi Apple</h3>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 text-sm">
            <dt>Nominal rupiah</dt><dd id="review-amount" />
            <dt>Biaya dalam nominal</dt><dd id="review-fee" />
            <dt>Total estimasi</dt><dd id="review-total" />
            <dt>Estimasi token diterima</dt><dd id="review-tokens" />
          </dl>
          <p className="text-sm text-landing-muted">Contoh biaya 0,5% termasuk dalam nominal. Simulasi ini tidak menarik rupiah.</p>
          <div className="flex flex-wrap gap-2">
            <button id="finish-preview" className={sampleAction} type="button">Selesaikan pratinjau</button>
            <button id="edit-order" type="button" className="min-h-11 cursor-pointer rounded-full border border-solid border-landing-border bg-transparent px-4 text-sm text-landing-text">
              Ubah nominal
            </button>
          </div>
        </section>

        <section id="portofolio" aria-labelledby="portfolio-title" className="border-0 border-t border-solid border-landing-border pt-4">
          <h3 id="portfolio-title" tabIndex={-1} className="text-base font-semibold text-white">Hasil simulasi</h3>
          <div className="mt-1 text-sm text-landing-muted" aria-live="polite">
            <p id="portfolio-state-title">Belum ada pratinjau.</p>
            <p id="portfolio-state-detail">Selesaikan simulasi untuk melihat ringkasannya.</p>
          </div>
        </section>
        <LegacyCalculator />
      </div>
    </details>
  );
}

export function LandingInformation() {
  return (
    <>
      <section id="cara-kerja" aria-labelledby="cara-kerja-judul" className="border-0 border-t border-solid border-landing-border py-10 sm:py-14">
        <h2 id="cara-kerja-judul" className="text-2xl font-semibold text-white">Cara kerja</h2>
        <ol className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step} className="flex items-baseline gap-3 rounded-xl border border-solid border-landing-border bg-landing-card p-4 text-sm/6">
              <span className="font-medium text-landing-accent" aria-hidden="true">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
        <SampleCalculator />
      </section>
      <section id="disclaimer" aria-labelledby="disclaimer-judul" className="border-0 border-t border-solid border-landing-border py-10 sm:py-14">
        <h2 id="disclaimer-judul" className="text-2xl font-semibold text-white">Disclaimer</h2>
        <p className="mt-3 max-w-2xl text-sm/6 text-landing-muted">
          Harga di beranda hanya ilustrasi. Pratinjau tidak menerima setoran, mendebit rupiah, atau mengirim token.
          AAPLB tidak tersedia untuk dibeli melalui OneStocks. Estimasi dan hak pemegang token bergantung pada penawaran serta ketentuan masing-masing penerbit.
        </p>
        <Link href="/saham/apple" className="mt-4 inline-flex min-h-11 items-center text-sm font-medium text-landing-accent hover:underline">
          Lihat estimasi Apple
        </Link>
      </section>
    </>
  );
}
