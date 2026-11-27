"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatAtomic } from "../saham/apple/quote-display";
import { type Wallet, useWalletSession } from "./session";

export function SignInControl({ className, label = "Masuk dengan Google", pendingLabel = "Menghubungkan ke Google…", showError = true }: {
  className: string;
  label?: string;
  pendingLabel?: string;
  showError?: boolean;
}) {
  const session = useWalletSession();

  switch (session.status) {
    case "loading":
      return <p role="status">Memeriksa sesi masuk…</p>;
    case "misconfigured":
      return <p role="alert">Konfigurasi Privy atau alamat situs belum valid untuk masuk.</p>;
    case "unavailable":
      return (
        <>
          <p role="alert">Layanan masuk belum bisa dimuat.</p>
          <button className={className} type="button" onClick={() => window.location.reload()}>Muat ulang</button>
        </>
      );
    case "signed-out":
      return (
        <>
          <button className={className} type="button" onClick={session.login} disabled={session.pending}>
            {session.pending ? pendingLabel : label}
          </button>
          {showError && session.failed && <p role="alert">Google belum bisa terhubung. Coba lagi.</p>}
        </>
      );
    default:
      return null;
  }
}

function PublicBalance({ address }: { address: string }) {
  const [message, setMessage] = useState("Memuat saldo devnet…");

  useEffect(() => {
    const request = new AbortController();
    const params = new URLSearchParams({ address });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8_000)]);

    async function load() {
      try {
        const response = await fetch(`/api/wallet/solana-balance?${params}`, { signal });
        const payload = await response.json();
        if (request.signal.aborted) return;
        if (response.ok && typeof payload.lamports === "string" && /^\d+$/.test(payload.lamports)) {
          setMessage(`Saldo devnet ${formatAtomic(payload.lamports, 9)} SOL`);
        } else {
          setMessage(payload.code === "RPC_NOT_CONFIGURED"
            ? "Saldo devnet belum dikonfigurasi."
            : "Saldo devnet belum bisa dimuat.");
        }
      } catch {
        if (!request.signal.aborted) setMessage("Saldo devnet belum bisa dimuat.");
      }
    }

    void load();
    return () => request.abort();
  }, [address]);

  return <p role="status">{message}</p>;
}

export function AccountMenu({ buttonClass }: { buttonClass: string }) {
  const session = useWalletSession();
  const [open, setOpen] = useState(false);
  const signedIn = session.status === "signed-in";
  const label = signedIn ? session.google?.name || session.google?.email || "Akun 1Stocks" : "Akun";

  return (
    <details className="relative text-sm" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary aria-label="Akun" className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-[10px] border border-solid border-landing-border bg-landing-card px-2.5 py-1.5 hover:bg-landing-badge">
        <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-landing-badge text-landing-accent">
          {label.slice(0, 1).toLocaleUpperCase("id")}
        </span>
        <span className="min-w-0">
          <span className="block max-w-36 truncate font-medium lg:max-w-full">{label}</span>
          <span className="hidden truncate text-xs text-landing-muted lg:block">
            {signedIn ? session.google?.email || "Sesi aktif" : "Pratinjau pembelian"}
          </span>
        </span>
      </summary>
      <div className="absolute top-full right-0 z-10 mt-2 grid w-[min(285px,calc(100vw-32px))] gap-3 rounded-[10px] border border-solid border-landing-border bg-landing-card p-3 shadow-lg lg:inset-[auto_auto_100%_0] lg:mt-0 lg:mb-2">
        {session.status === "unconfigured" && <p>Mode tamu. Pratinjau pembelian tersedia tanpa akun.</p>}
        <SignInControl className={buttonClass} />
        {signedIn && (
          <>
            <WalletDetails wallet={session.wallet} buttonClass={buttonClass} showBalance={open} />
            <SignOutControl className={buttonClass} />
          </>
        )}
        <Link href="/pengaturan" className="text-landing-accent hover:underline">Pengaturan akun</Link>
        <Link href="/" className="text-landing-muted hover:underline">Ke halaman awal</Link>
      </div>
    </details>
  );
}

export function WalletDetails({ wallet, buttonClass, showBalance = false }: {
  wallet: Wallet;
  buttonClass: string;
  showBalance?: boolean;
}) {
  if (wallet.status === "loading") return <p role="status">Menyiapkan dompet Solana…</p>;
  if (wallet.status === "unavailable") {
    return (
      <>
        <p role="alert">Dompet Solana belum bisa disiapkan.</p>
        <button className={buttonClass} type="button" onClick={wallet.retry}>Coba lagi</button>
      </>
    );
  }
  return (
    <>
      <dl>
        <dt className="text-landing-muted">Alamat publik Solana</dt>
        <dd className="mt-1! wrap-anywhere"><code>{wallet.address}</code></dd>
      </dl>
      {showBalance && <PublicBalance key={wallet.address} address={wallet.address} />}
    </>
  );
}

export function SignOutControl({ className }: { className: string }) {
  const session = useWalletSession();
  if (session.status !== "signed-in") return null;
  return (
    <>
      <button className={className} type="button" onClick={session.logout} disabled={session.pending}>
        {session.pending ? "Keluar…" : "Keluar"}
      </button>
      {session.failed && <p role="alert">Sesi belum bisa diakhiri. Coba lagi.</p>}
    </>
  );
}
