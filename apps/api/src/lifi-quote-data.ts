import { SOLANA_MAINNET_LIFI_CHAIN_ID, type QuoteFee } from "@1stocks/shared";

type LifiFee = {
  name?: unknown;
  type?: unknown;
  amount?: unknown;
  amountUSD?: unknown;
  included?: unknown;
  token?: { address?: unknown; decimals?: unknown; symbol?: unknown; chainId?: unknown };
};

export function isAtomic(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,32}$/.test(value);
}

function usdAmount(value: unknown) {
  return typeof value === "string" && /^\d{1,20}(?:\.\d{1,12})?$/.test(value) ? value : undefined;
}

export function normalizeLifiFees(raw: unknown, chains: readonly number[], kind: "fee" | "gas") {
  const items: QuoteFee[] = [];
  let complete = Array.isArray(raw) && (kind !== "gas" || raw.length > 0);
  if (!Array.isArray(raw)) return { items, complete };

  for (const fee of raw as (LifiFee | null)[]) {
    const name = fee?.name ?? fee?.type;
    const token = fee?.token;
    if (!fee || typeof name !== "string" || !name.trim() || name.length > 100 ||
        typeof token?.address !== "string" || !token.address.trim() || token.address.length > 64 ||
        typeof token.symbol !== "string" || !token.symbol.trim() || token.symbol.length > 20 ||
        typeof token.decimals !== "number" || !Number.isInteger(token.decimals) ||
        token.decimals < 0 || token.decimals > 255 || !isAtomic(fee.amount)) {
      complete = false;
      continue;
    }

    const chain = typeof token.chainId === "number" && chains.includes(token.chainId) ? token.chainId : undefined;
    const validAddress = chain === SOLANA_MAINNET_LIFI_CHAIN_ID
      ? /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token.address)
      : /^0x[0-9a-f]{40}$/i.test(token.address);
    if (token.chainId !== undefined && (chain === undefined || !validAddress)) {
      complete = false;
      continue;
    }
    const reportedUsd = usdAmount(fee.amountUSD);
    if (chain === undefined || !validAddress || (kind === "fee" && typeof fee.included !== "boolean") ||
        (fee.amountUSD !== undefined && reportedUsd === undefined)) complete = false;

    items.push({
      name,
      amount: { symbol: token.symbol, mint: token.address, decimals: token.decimals, amountAtomic: fee.amount },
      ...(typeof fee.included === "boolean" && { included: fee.included }),
      ...(reportedUsd !== undefined && { reportedUsd }),
    });
  }
  return { items, complete };
}
