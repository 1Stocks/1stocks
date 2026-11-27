import { isAddress, type Address } from "@solana/kit";

export type DemoToken = {
  assetType: "demo";
  network: "solana-devnet";
  issuer: "1Stocks Demo";
  symbol: string;
  mint: Address;
};

export function readDemoRegistry(config: string | undefined): DemoToken[] {
  if (!config) return [];
  try {
    const value: unknown = JSON.parse(config);
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    const seen = new Set<string>();
    return Object.entries(value).slice(0, 25).flatMap(([symbol, mint]): DemoToken[] => {
      if (!/^DEMO-[A-Z0-9-]{2,40}$/.test(symbol) || typeof mint !== "string" || !isAddress(mint) || seen.has(mint)) return [];
      seen.add(mint);
      return [{ symbol, mint, assetType: "demo", network: "solana-devnet", issuer: "1Stocks Demo" }];
    });
  } catch {
    return [];
  }
}
