import {
  SOLANA_MAINNET_LIFI_CHAIN_ID, tokenRegistry,
  type AppleBuyToken, type AppleQuoteResult, type AppleQuotesResponse, type QuoteErrorCode, type QuoteFee,
} from "@1stocks/shared";
import { selectAppleIssuer, type AppleIssuerEvidence } from "./issuer-selection";

const QUOTE_URL = "https://li.quest/v1/quote";
const IDRX = tokenRegistry.IDRX.solanaMainnet.mint;
const QUOTE_TTL_MS = 30_000;
const FAILURE_TTL_MS = 3_000;
const CACHE_LIMIT = 256;
const MAX_IN_FLIGHT = 16;
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function isSolanaPublicAddress(address: string): boolean {
  if (address.length < 32 || address.length > 44) return false;
  let value = 0n;
  for (const character of address) {
    const digit = BASE58.indexOf(character);
    if (digit === -1) return false;
    value = value * 58n + BigInt(digit);
  }
  const zeros = address.match(/^1*/)?.[0].length ?? 0;
  const bytes = value === 0n ? 0 : Math.ceil(value.toString(16).length / 2);
  return zeros + bytes === 32;
}

export function readIdrxAmount(value: string | null): string | null {
  if (!value || !/^\d{1,12}(?:\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  return amount > 0n ? amount.toString() : null;
}

type LifiToken = { address?: string; decimals?: number; symbol?: string; chainId?: number };
type LifiFee = { name?: string; type?: string; amount?: string; token?: LifiToken; included?: boolean };
type LifiQuote = {
  id?: string;
  tool?: string;
  action?: { fromToken?: LifiToken; toToken?: LifiToken; fromAmount?: string };
  estimate?: { toAmount?: string; toAmountMin?: string; feeCosts?: LifiFee[]; gasCosts?: LifiFee[] };
};
type Options = { fromAddress: string; apiKey?: string; fetcher?: typeof fetch; now?: () => number };
type CacheEntry = { result: AppleQuoteResult; until: number };

function isAtomic(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,30}$/.test(value);
}

function fees(list: LifiFee[] | undefined): QuoteFee[] {
  if (!Array.isArray(list)) return [];
  return list.flatMap((fee) => {
    const name = fee?.name ?? fee?.type;
    const token = fee?.token;
    if (typeof name !== "string" || typeof token?.address !== "string" ||
        typeof token.symbol !== "string" || typeof token.decimals !== "number" ||
        !Number.isInteger(token.decimals) || token.decimals < 0 || token.decimals > 255 ||
        !isAtomic(fee.amount)) return [];
    return [{
      name,
      amount: { symbol: token.symbol, mint: token.address, decimals: token.decimals, amountAtomic: fee.amount },
      ...(typeof fee.included === "boolean" && { included: fee.included }),
    }];
  });
}

function normalizeQuote(raw: unknown, token: AppleBuyToken, amount: string, timestamp: number): AppleQuoteResult {
  const mint = tokenRegistry[token].solanaMainnet.mint;
  const quote = raw as LifiQuote | null;
  const action = quote?.action;
  const estimated = quote?.estimate;
  if (typeof quote?.id !== "string" || !quote.id ||
      action?.fromToken?.address !== IDRX.address || action.fromToken.decimals !== IDRX.decimals ||
      action.fromToken.chainId !== SOLANA_MAINNET_LIFI_CHAIN_ID || action.fromAmount !== amount ||
      action.toToken?.address !== mint.address || action.toToken.decimals !== mint.decimals ||
      action.toToken.chainId !== SOLANA_MAINNET_LIFI_CHAIN_ID ||
      !isAtomic(estimated?.toAmount) || !isAtomic(estimated.toAmountMin)) {
    return { status: "unavailable", token, code: "UPSTREAM_ERROR" };
  }
  const output = BigInt(estimated.toAmount);
  if (!output || BigInt(estimated.toAmountMin) > output) {
    return { status: "unavailable", token, code: "UPSTREAM_ERROR" };
  }

  const priceHundredths = (BigInt(amount) * 10n ** BigInt(mint.decimals) + output / 2n) / output;
  const price = `${priceHundredths / 100n}.${(priceHundredths % 100n).toString().padStart(2, "0")}`;
  return {
    status: "quoted",
    token,
    quoteId: quote.id,
    fetchedAt: new Date(timestamp).toISOString(),
    expiresAt: new Date(timestamp + QUOTE_TTL_MS).toISOString(),
    router: typeof quote.tool === "string" ? quote.tool : null,
    output: { symbol: token, mint: mint.address, decimals: mint.decimals, amountAtomic: estimated.toAmount },
    minimumOutputAtomic: estimated.toAmountMin,
    idrxPerToken: price,
    feeCosts: fees(estimated.feeCosts),
    gasCosts: fees(estimated.gasCosts),
  };
}

export function createAppleQuoteService({ fromAddress, apiKey, fetcher = fetch, now = Date.now }: Options) {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<AppleQuoteResult>>();
  let rateLimitedUntil = 0;

  async function request(token: AppleBuyToken, amount: string): Promise<AppleQuoteResult> {
    const params = new URLSearchParams({
      fromChain: String(SOLANA_MAINNET_LIFI_CHAIN_ID),
      toChain: String(SOLANA_MAINNET_LIFI_CHAIN_ID),
      fromToken: IDRX.address,
      toToken: tokenRegistry[token].solanaMainnet.mint.address,
      fromAmount: amount,
      fromAddress,
    });
    const signal = AbortSignal.timeout(7_000);
    const unavailable = (code: QuoteErrorCode): AppleQuoteResult => ({ status: "unavailable", token, code });
    try {
      const response = await fetcher(`${QUOTE_URL}?${params}`, {
        signal,
        cache: "no-store",
        headers: apiKey ? { "x-lifi-api-key": apiKey } : undefined,
      });
      if (response.status === 429) {
        const seconds = Number(response.headers.get("retry-after"));
        rateLimitedUntil = Math.max(rateLimitedUntil, now() + 1_000 * Math.max(3, Math.min(seconds || 3, 60)));
        return unavailable("RATE_LIMITED");
      }
      if (!response.ok) {
        const error: { code?: unknown } | null = await response.json().catch(() => null);
        if (error?.code === 1002 || error?.code === "NO_QUOTE") return unavailable("NO_ROUTE");
        return unavailable("UPSTREAM_ERROR");
      }
      return normalizeQuote(await response.json(), token, amount, now());
    } catch (error) {
      const timeout = signal.aborted || (error instanceof Error && error.name === "TimeoutError");
      return unavailable(timeout ? "TIMEOUT" : "UPSTREAM_ERROR");
    }
  }

  function getQuote(token: AppleBuyToken, amount: string): Promise<AppleQuoteResult> {
    const key = `${token}:${amount}`;
    const hit = cache.get(key);
    if (hit && hit.until > now()) return Promise.resolve(hit.result);
    cache.delete(key);
    const active = inFlight.get(key);
    if (active) return active;
    if (rateLimitedUntil > now()) return Promise.resolve({ status: "unavailable", token, code: "RATE_LIMITED" });
    if (inFlight.size >= MAX_IN_FLIGHT) return Promise.resolve({ status: "unavailable", token, code: "BUSY" });

    const pending = request(token, amount).then((result) => {
      const until = result.status === "quoted" ? Date.parse(result.expiresAt) : now() + FAILURE_TTL_MS;
      if (cache.size >= CACHE_LIMIT) {
        const oldest = cache.keys().next();
        if (!oldest.done) cache.delete(oldest.value);
      }
      cache.set(key, { result, until });
      return result;
    }).finally(() => inFlight.delete(key));
    inFlight.set(key, pending);
    return pending;
  }

  async function getAppleQuotes(amount: string, evidence?: AppleIssuerEvidence): Promise<AppleQuotesResponse> {
    const evaluation = await selectAppleIssuer(amount, (token) => getQuote(token, amount), now, evidence);
    return {
      source: "LI.FI",
      cluster: "solana-mainnet",
      mode: "quote-only",
      input: { symbol: "IDRX", mint: IDRX.address, decimals: IDRX.decimals, amountAtomic: amount },
      ...evaluation,
    };
  }

  return { getAppleQuotes };
}
