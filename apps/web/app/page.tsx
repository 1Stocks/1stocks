import Image from "next/image";
import { apple } from "@1stocks/shared";

const quickAmounts = [
  [100000, "Rp100.000"],
  [250000, "Rp250.000"],
  [500000, "Rp500.000"],
] as const;

function Brand() {
  return (
    <a className="brand" href="#awal" aria-label="1Stocks, kembali ke awal">
      <Image src="/brand/logo-light.svg" width={124} height={40} alt="" unoptimized />
    </a>
  );
}

export default function Home() {
  return (
    <div className="landing" id="awal">
      <a className="skip" href="#utama">Ke konten utama</a>
      <header className="header">
        <div className="frame navigation">
          <Brand />
          <nav aria-label="Navigasi utama">
            <a href="#saham">Saham</a>
            <a href="#portofolio">Portofolio</a>
          </nav>
        </div>
      </header>

      <main id="utama" tabIndex={-1}>
        <div className="hero-surface">
          <section className="frame hero" aria-labelledby="judul">
            <div className="hero-copy">
              <h1 id="judul">Beli token saham<br className="desktop-break" /> pakai rupiah.</h1>
              <p>Pilih saham, masukkan nominal, lalu lihat estimasi token dan biaya sebelum melanjutkan.</p>

              <div className="asset-list" id="saham">
                <h2>Saham yang bisa dicoba</h2>
                <a href="#nominal" className="asset-option" id="select-apple">
                  <span className="asset-name"><strong>{apple.name}</strong><span>{apple.ticker}</span></span>
                  <span className="asset-action">Pilih Apple</span>
                </a>
              </div>
            </div>

            <div className="calculator" id="estimasi">
              <header className="order-header">
                <h2 id="order-title">Estimasi Apple</h2>
                <p>Harga contoh Rp4.000.000 per token</p>
              </header>

              <form id="estimate-form" aria-labelledby="order-title">
                <label htmlFor="nominal">Nominal rupiah</label>
                <div className="amount-field">
                  <span aria-hidden="true">Rp</span>
                  <input id="nominal" name="amount" type="text" inputMode="numeric" autoComplete="off" maxLength={12} defaultValue="250.000" aria-describedby="amount-help" />
                </div>
                <p id="amount-help" className="amount-help"></p>
                <div className="quick-amounts" role="group" aria-label="Pilihan nominal">
                  {quickAmounts.map(([amount, label]) => (
                    <button type="button" key={amount} data-amount={amount} aria-pressed={amount === 250000 ? "true" : "false"}>{label}</button>
                  ))}
                </div>
                <dl className="quote">
                  <div className="fee-row">
                    <dt>Biaya <span>Termasuk dalam nominal</span></dt>
                    <dd id="estimate-fee">Rp1.250</dd>
                  </div>
                  <div className="estimate-output">
                    <dt>Estimasi token diterima</dt>
                    <dd id="estimate-tokens">0,062187</dd>
                  </div>
                </dl>
                <button className="button button-primary" type="submit">Tinjau estimasi</button>
                <p id="estimate-live" className="sr-only" aria-live="polite" aria-atomic="true"></p>
              </form>

              <section id="order-review" className="review" aria-labelledby="review-title" hidden>
                <h3 id="review-title" tabIndex={-1}>Tinjau estimasi Apple</h3>
                <dl className="quote review-quote">
                  <div><dt>Nominal rupiah</dt><dd id="review-amount"></dd></div>
                  <div className="fee-row"><dt>Biaya <span>Termasuk dalam nominal</span></dt><dd id="review-fee"></dd></div>
                  <div className="review-total"><dt>Total estimasi</dt><dd id="review-total"></dd></div>
                  <div className="estimate-output"><dt>Estimasi token diterima</dt><dd id="review-tokens"></dd></div>
                </dl>
                <details className="quote-details">
                  <summary>Rincian estimasi</summary>
                  <p>Harga contoh Rp4.000.000 per token dengan biaya 0,5% dari nominal. Token, penerbit, dan rute belum tersedia di pratinjau.</p>
                </details>
                <p className="order-note">Tidak ada rupiah yang ditarik.</p>
                <button className="button button-primary" id="finish-preview" type="button">Selesaikan pratinjau</button>
                <button className="button button-text" id="edit-order" type="button">Ubah nominal</button>
              </section>
            </div>
          </section>
        </div>

        <section className="ownership" id="portofolio" aria-labelledby="portfolio-title">
          <div className="frame section-grid">
            <h2 id="portfolio-title" tabIndex={-1}>Portofolio</h2>
            <div className="portfolio-state" aria-live="polite">
              <h3 id="portfolio-state-title">Portofolio belum terhubung</h3>
              <p id="portfolio-state-detail">Kepemilikan tampil setelah transaksi berhasil dikonfirmasi di aplikasi.</p>
            </div>
          </div>
        </section>

        <section className="faq" id="faq" aria-labelledby="faq-judul">
          <div className="frame section-grid">
            <h2 id="faq-judul">Tentang token saham</h2>
            <div className="faq-list">
              <details>
                <summary>Apa yang saya terima saat membeli?</summary>
                <p>Token yang mengikuti nilai saham Apple. Hak pemegang bergantung pada ketentuan penerbit token.</p>
              </details>
              <details>
                <summary>Apakah harga bisa berubah?</summary>
                <p>Harga dan jumlah token bisa berubah sebelum eksekusi. Kalkulator ini memakai harga contoh.</p>
              </details>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="frame footer-content">
          <Brand />
          <a href="#awal">Kembali ke atas</a>
        </div>
      </footer>
    </div>
  );
}
