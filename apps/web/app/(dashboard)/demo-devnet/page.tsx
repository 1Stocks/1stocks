import type { Metadata } from "next";
import { isAddress } from "@solana/kit";
import { readDemoRegistry } from "../../../../../packages/asset-catalog/registry/demo";
import { pageTitle } from "../_components/styles";
import { DevnetDemo } from "./demo";

export const metadata: Metadata = { title: "Demo Solana Devnet | 1Stocks" };
export const dynamic = "force-dynamic";

export default function DevnetPage() {
  const mint = process.env.SOLANA_DEMO_TOKEN_MINT?.trim() ?? "";
  const tokens = readDemoRegistry(process.env.SOLANA_DEMO_TOKEN_REGISTRY);
  return (
    <div className="grid max-w-2xl gap-4">
      <h1 className={pageTitle}>Demo Solana Devnet</h1>
      <p>Transfer token SPL demo ini berjalan terpisah dari pratinjau saham Apple. Token demo tidak memiliki nilai finansial.</p>
      <p className="text-sm text-landing-muted">Dompet pengirim memerlukan token demo dan SOL devnet. Dompet penerima harus sudah memiliki akun untuk mint yang sama.</p>
      <DevnetDemo mint={isAddress(mint) ? mint : null} tokens={tokens} />
    </div>
  );
}
