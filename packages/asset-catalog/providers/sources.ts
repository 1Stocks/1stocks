import { deployment, normalizeIsin, parseCsv, type OfficialAsset } from "./normalize";

export const sources = {
  xstocks: "https://api.xstocks.fi/api/v2/public/assets",
  ondo: "https://docs.ondo.finance/addresses",
  bstocks: "https://www.binance.com/en-IN/square/post/349898403645041",
} as const;

async function read(url: string, request: typeof fetch) {
  const response = await request(url, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`Source HTTP ${response.status}`);
  return response;
}

export async function discoverXstocks(request = fetch) {
  const assets: OfficialAsset[] = [];
  for (let page = 0; page < 25; page++) {
    const result = await (await read(`${sources.xstocks}?page=${page}`, request)).json();
    if (result?.page?.currentPage !== page || typeof result.page.hasNextPage !== "boolean" || !Array.isArray(result.nodes)) {
      throw new Error("Invalid xStocks pagination");
    }
    for (const item of result.nodes) {
      if (!item || typeof item.name !== "string" || typeof item.symbol !== "string" ||
        typeof item.underlyingSymbol !== "string" || !Array.isArray(item.deployments)) continue;
      const deployments = item.deployments.flatMap((record: { network?: unknown; chainId?: unknown; address?: unknown } | null) => {
        if (!record) return [];
        if (record.network === "Solana") return deployment("solana-mainnet", record.address, "Token-2022");
        if (typeof record.chainId === "number" && Number.isSafeInteger(record.chainId) && record.chainId > 0) {
          return deployment(`eip155:${record.chainId}`, record.address, "ERC-20");
        }
        return [];
      });
      if (!deployments.length) continue;
      assets.push({ assetType: "official", issuer: "xstocks", symbol: item.symbol,
        underlying: { isin: normalizeIsin(item.underlyingIsin), ticker: item.underlyingSymbol, name: item.name.replace(/ xStock$/i, ""), kind: "unknown" },
        deployments, source: `${sources.xstocks}/${encodeURIComponent(item.symbol)}`, halted: item.isTradingHalted === true,
      });
    }
    if (!result.page.hasNextPage) return assets;
  }
  throw new Error("xStocks pagination exceeded its safety limit");
}

const ondoCsv = "https://www.dropbox.com/scl/fi/qjfxyg748mx0dwi6up86d/EXTERNAL-Ondo-GM-Tokens-Ondo-GM-Tokens.csv?rlkey=n3no1w78wrah3umsl0nr9s77i&dl=1";

export async function discoverOndo(request = fetch): Promise<OfficialAsset[]> {
  const rows = parseCsv(await (await read(ondoCsv, request)).text());
  return rows.flatMap(row => {
    if ((row.Type !== "Stock" && row.Type !== "ETF") || !row.Symbol || !row["Stock Ticker"] || !row["Stock Name"]) return [];
    const deployments = [
      ...deployment("solana-mainnet", row["Solana Deployed Address"], "Token-2022"),
      ...deployment("eip155:1", row["Ethereum Deployed Address"], "ERC-20"),
      ...deployment("eip155:56", row["BSC Deployed Address"], "BEP-20"),
      ...deployment("eip155:999", row["HyperEVM Deployed Address"], "ERC-20"),
    ];
    return deployments.length ? [{
      assetType: "official", issuer: "ondo", symbol: row.Symbol, deployments, source: sources.ondo,
      underlying: { isin: normalizeIsin(row.ISIN), ticker: row["Stock Ticker"], name: row["Stock Name"], kind: row.Type === "Stock" ? "stock" : "etf" },
    }] : [];
  });
}

// Listing and BNB contract cross-reference are documented in ADR 0001.
export const verifiedBstocks: OfficialAsset[] = [{
  assetType: "official", issuer: "bstocks", symbol: "AAPLB", source: sources.bstocks,
  underlying: { isin: "US0378331005", ticker: "AAPL", name: "Apple", kind: "stock" },
  deployments: deployment("eip155:56", "0x431a3bee82e2ca41e49895cbece5bb0f76a89b7a", "BEP-20"),
}];
