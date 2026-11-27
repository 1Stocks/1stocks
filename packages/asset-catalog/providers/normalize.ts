import { isAddress } from "@solana/kit";

export type Issuer = "xstocks" | "ondo" | "bstocks";
export type OfficialAsset = {
  assetType: "official";
  issuer: Issuer;
  symbol: string;
  underlying: { isin: string | null; ticker: string; name: string; kind: "stock" | "etf" | "unknown" };
  deployments: { chain: string; address: string; standard: string }[];
  source: string;
  halted?: boolean;
};

export type ProviderSnapshot = { verifiedAt: string; assets: OfficialAsset[] };

export function deployment(chain: string, raw: unknown, standard: string) {
  if (typeof raw !== "string") return [];
  const solana = chain === "solana-mainnet";
  if (solana ? !isAddress(raw) : !/^0x[0-9a-f]{40}$/i.test(raw)) return [];
  return [{ chain, address: solana ? raw : raw.toLowerCase(), standard }];
}

export function normalizeIsin(value: unknown) {
  return typeof value === "string" && /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(value) ? value : null;
}

export function parseCsv(text: string) {
  const rows: string[][] = [[]];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === "," || c === "\n")) {
      rows.at(-1)!.push(value.replace(/\r$/, ""));
      value = "";
      if (c === "\n") rows.push([]);
    } else value += c;
  }
  if (quoted) throw new Error("CSV quotation is incomplete");
  rows.at(-1)!.push(value.replace(/\r$/, ""));
  const [header, ...data] = rows;
  return data.filter(row => row.length === header.length).map(row =>
    Object.fromEntries(header.map((key, index) => [key, row[index]])),
  );
}
