"use client";

import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { isAddress, type Address, type Signature } from "@solana/kit";
import { useRef, useState } from "react";
import { formatAtomic } from "../../saham/apple/quote-display";
import { SignInControl } from "../../wallet/account";
import { useWalletSession } from "../../wallet/session";
import { panel, primaryButton, secondaryButton } from "../_components/styles";
import { checkTransfer, confirmedTokenBalance, DemoTransferError, prepareTransfer, signedTransferSignature, submitTransfer } from "./transfer";

export function DevnetDemo({ mint }: { mint: Address | null }) {
  const session = useWalletSession();
  if (!mint) return <p>Mint token SPL demo belum dikonfigurasi.</p>;
  if (session.status === "unconfigured") return <p>Masuk melalui Privy diperlukan untuk menandatangani transfer devnet.</p>;
  if (session.status !== "signed-in") return <SignInControl className={primaryButton} />;
  if (session.wallet.status === "loading") return <p role="status">Menyiapkan dompet Solana…</p>;
  if (session.wallet.status === "unavailable") return <button type="button" className={secondaryButton} onClick={session.wallet.retry}>Coba siapkan dompet lagi</button>;
  if (!isAddress(session.wallet.address)) return <p role="alert">Alamat dompet tidak valid.</p>;
  return <TransferForm key={session.wallet.address} mint={mint} from={session.wallet.address} />;
}

function TransferForm({ mint, from }: { mint: Address; from: Address }) {
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const wallet = wallets.find(item => item.address === from);
  const [recipient, setRecipient] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "signing" | "checking" | "pending" | "confirmed" | "failed">("idle");
  const [signature, setSignature] = useState<Signature>();
  const [error, setError] = useState("");
  const [beforeBalance, setBeforeBalance] = useState<string>();
  const [afterBalance, setAfterBalance] = useState<string>();
  const running = useRef(false);
  const busy = phase === "signing" || phase === "checking";
  const locked = busy || phase === "pending" || phase === "confirmed";

  async function confirm(sig: Signature) {
    setPhase("checking");
    try {
      const status = await checkTransfer(sig);
      setPhase(status);
      if (status === "confirmed") {
        const balance = await confirmedTokenBalance(from, mint).catch(() => null);
        if (balance) setAfterBalance(formatAtomic(balance.amount, balance.decimals));
      }
    } catch { setPhase("pending"); }
  }

  async function transfer() {
    if (!wallet || !agreed || locked || running.current) return;
    running.current = true;
    setPhase("signing");
    setError("");
    setSignature(undefined);
    let sig: Signature | undefined;
    try {
      const { transaction, balance } = await prepareTransfer(from, mint, recipient.trim());
      setBeforeBalance(formatAtomic(balance.amount, balance.decimals));
      const { signedTransaction } = await signTransaction({ transaction, wallet, chain: "solana:devnet", options: { uiOptions: { showWalletUIs: true } } });
      sig = signedTransferSignature(signedTransaction, transaction);
      setSignature(sig);
      await submitTransfer(signedTransaction);
      await confirm(sig);
    } catch (problem) {
      if (sig) {
        setPhase("pending");
        setError("Pengiriman belum terverifikasi. Periksa status sebelum mencoba transfer lain.");
      } else {
        setPhase("idle");
        setError(problem instanceof DemoTransferError ? problem.message : "Transfer belum dikirim. Periksa jaringan, SOL devnet, atau konfirmasi tanda tangan.");
      }
    } finally {
      running.current = false;
    }
  }

  return (
    <form className={`${panel} grid gap-4`} onSubmit={event => { event.preventDefault(); void transfer(); }}>
      <p className="text-sm wrap-anywhere">Mint demo <code>{mint}</code></p>
      <label className="grid gap-2 text-sm">
        Alamat dompet penerima
        <input required value={recipient} onChange={event => setRecipient(event.target.value)} disabled={locked}
          autoComplete="off" maxLength={44} className="rounded-lg border border-solid border-landing-border bg-landing-canvas p-3 text-landing-text" />
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={agreed} disabled={locked} onChange={event => setAgreed(event.target.checked)} />
        Saya setuju mengirim 1 token demo tanpa nilai finansial melalui Solana devnet.
      </label>
      <button type="submit" className={primaryButton} disabled={!wallet || !agreed || !isAddress(recipient.trim()) || locked}>Tandatangani dan kirim token demo</button>
      {!wallet && <p role="status">Dompet belum siap untuk tanda tangan.</p>}
      {busy && <p role="status">{phase === "checking" ? "Menunggu konfirmasi devnet…" : "Menyiapkan dan meminta tanda tangan…"}</p>}
      {phase === "confirmed" && <p role="status">Transfer dikonfirmasi di Solana devnet.</p>}
      {phase === "confirmed" && afterBalance !== undefined && (
        <p className="text-sm">Saldo token demo pengirim dari RPC · sebelum {beforeBalance} · sesudah {afterBalance}.</p>
      )}
      {phase === "failed" && <p role="alert">Solana devnet melaporkan transaksi gagal.</p>}
      {phase === "pending" && signature && <button type="button" className={secondaryButton} onClick={() => void confirm(signature)}>Periksa ulang status</button>}
      {error && <p role="alert">{error}</p>}
      {signature && <a href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`} target="_blank" rel="noreferrer" className="wrap-anywhere text-landing-accent">Solana Explorer · {signature}</a>}
    </form>
  );
}
