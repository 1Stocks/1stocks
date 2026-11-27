import Link from "next/link";
import { pageTitle, panel, primaryButton } from "./styles";

export function FundingPage({ withdrawal = false }: { withdrawal?: boolean }) {
  const title = withdrawal ? "Withdraw ke bank" : "Deposit Rupiah";
  const action = withdrawal ? "Withdraw" : "Deposit";

  return (
    <div className="grid max-w-3xl gap-[18px]">
      <Link href="/beranda" className="w-fit text-sm text-landing-accent hover:underline">← Kembali ke Beranda</Link>
      <h1 className={pageTitle}>{title}</h1>
      <section className={`${panel} grid gap-4`} aria-labelledby="status-dana">
        <div className="grid gap-2">
          <h2 id="status-dana" className="text-lg font-semibold text-white">{action} belum tersedia</h2>
          <p className="text-sm text-landing-muted">
            {withdrawal ? "Penarikan dana ke rekening bank belum tersedia di demo ini." : "Pengisian saldo dengan virtual account dan QRIS belum tersedia di demo ini."}
          </p>
        </div>
        <dl className="grid gap-3 border-y border-solid border-landing-border py-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2"><dt className="text-landing-muted">Jumlah (rupiah)</dt><dd>—</dd></div>
          <div className="flex flex-wrap justify-between gap-2">
            <dt className="text-landing-muted">{withdrawal ? "Rekening tujuan" : "Metode pembayaran"}</dt>
            <dd>Belum tersedia</dd>
          </div>
        </dl>
        <button type="button" disabled className={primaryButton}>{withdrawal ? "Tarik dana" : "Lanjut bayar"}</button>
      </section>
      <Link href="/saham/apple" className="w-fit text-sm text-landing-accent hover:underline">Coba pratinjau Apple tanpa saldo →</Link>
    </div>
  );
}
