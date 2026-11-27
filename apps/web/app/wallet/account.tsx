"use client";

import { useEffect, useState } from "react";
import { formatAtomic } from "../saham/apple/quote-display";
import { useWalletSession } from "./session";
import styles from "./wallet.module.css";

export function SignInControl({ className }: { className: string }) {
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
            {session.pending ? "Menghubungkan ke Google…" : "Masuk dengan Google"}
          </button>
          {session.failed && <p role="alert">Google belum bisa terhubung. Coba lagi.</p>}
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

  return (
    <details className={styles.account} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{session.status === "signed-in" ? "Dompet Solana" : "Akun"}</summary>
      <div className={styles.menu}>
        {session.status === "unconfigured" && <p>Google belum dikonfigurasi. Pratinjau tetap tersedia.</p>}
        <SignInControl className={buttonClass} />
        {session.status === "signed-in" && (
          <>
            {session.wallet.status === "loading" && <p role="status">Menyiapkan dompet Solana…</p>}
            {session.wallet.status === "unavailable" && (
              <>
                <p role="alert">Dompet Solana belum bisa disiapkan.</p>
                <button className={buttonClass} type="button" onClick={session.wallet.retry}>Coba lagi</button>
              </>
            )}
            {session.wallet.status === "ready" && (
              <>
                <dl>
                  <dt>Alamat publik</dt>
                  <dd><code>{session.wallet.address}</code></dd>
                </dl>
                {open && <PublicBalance key={session.wallet.address} address={session.wallet.address} />}
              </>
            )}
            <button className={buttonClass} type="button" onClick={session.logout} disabled={session.pending}>
              {session.pending ? "Keluar…" : "Keluar"}
            </button>
            {session.failed && <p role="alert">Sesi belum bisa diakhiri. Coba lagi.</p>}
          </>
        )}
      </div>
    </details>
  );
}
