"use client";

import type { OfficialAppleHolding } from "@1stocks/shared";
import { useEffect, useState } from "react";
import { useWalletSession } from "../../wallet/session";

function Holdings({ address }: { address: string }) {
  const [state, setState] = useState<"loading" | "unavailable" | OfficialAppleHolding[]>("loading");

  useEffect(() => {
    const request = new AbortController();
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(8_000)]);
    const params = new URLSearchParams({ address });

    async function load() {
      try {
        const response = await fetch(`/api/wallet/official-apple-holdings?${params}`, { signal });
        if (!response.ok) throw new Error("Holdings unavailable");
        const payload = await response.json();
        if (payload.cluster !== "mainnet-beta" || !Array.isArray(payload.holdings)) {
          throw new Error("Invalid holdings response");
        }
        if (!request.signal.aborted) setState(payload.holdings);
      } catch {
        if (!request.signal.aborted) setState("unavailable");
      }
    }

    void load();
    return () => request.abort();
  }, [address]);

  if (state === "loading") return <p role="status">Memuat saldo mainnet…</p>;
  if (state === "unavailable") return <p role="alert">Saldo mainnet belum bisa dimuat.</p>;
  if (state.length === 0) return <p>Belum ada saldo AAPLx atau AAPLon di dompet ini.</p>;

  return (
    <ul className="grid w-full gap-2 text-sm">
      {state.map(holding => (
        <li key={holding.account} className="grid gap-1 border-t border-landing-border py-2 wrap-anywhere">
          <strong>{holding.token}</strong>
          <span>{holding.amountDisplay?.replace(".", ",") ?? `${holding.amountAtomic} unit atomik`}</span>
        </li>
      ))}
    </ul>
  );
}

export function OfficialAppleHoldings() {
  const session = useWalletSession();
  if (session.status === "loading" || (session.status === "signed-in" && session.wallet.status === "loading")) {
    return <p role="status">Menyiapkan dompet Solana…</p>;
  }
  if (session.status === "signed-in") {
    if (session.wallet.status === "ready") {
      return <Holdings key={session.wallet.address} address={session.wallet.address} />;
    }
    return <p>Dompet perlu siap sebelum saldo mainnet dapat dibaca.</p>;
  }
  return <p>Masuk untuk melihat saldo AAPLx dan AAPLon dari dompet Solana.</p>;
}
