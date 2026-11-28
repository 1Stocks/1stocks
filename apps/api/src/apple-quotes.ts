import {
  SOLANA_MAINNET_LIFI_CHAIN_ID, tokenRegistry,
  type AppleBuyToken, type AppleQuoteResult, type AppleQuotesResponse, type QuoteErrorCode,
} from "@1stocks/shared";
import { createAppleMultichainQuotePreview } from "./apple-multichain-quotes";
import { isAtomic, normalizeLifiFees } from "./lifi-quote-data";
import { applePreviewRoute, selectAppleIssuer, type AppleIssuerEvidence } from "./issuer-selection";

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
type LifiQuote = {
  id?: string;
  tool?: string;
  action?: { fromToken?: LifiToken; toToken?: LifiToken; fromAmount?: string };
  estimate?: { toAmount?: string; toAmountMin?: string; feeCosts?: unknown; gasCosts?: unknown };
};
type Options = { fromAddress: string; apiKey?: string; multichainPreview?: boolean; fetcher?: typeof fetch; now?: () => number };
type CacheEntry = { result: AppleQuoteResult; until: number };

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
  const tool = typeof quote.tool === "string" ? quote.tool : null;
  const feeCosts = normalizeLifiFees(estimated.feeCosts, [SOLANA_MAINNET_LIFI_CHAIN_ID], "fee");
  const gasCosts = normalizeLifiFees(estimated.gasCosts, [SOLANA_MAINNET_LIFI_CHAIN_ID], "gas");
  return {
    status: "quoted",
    token,
    quoteId: quote.id,
    fetchedAt: new Date(timestamp).toISOString(),
    expiresAt: new Date(timestamp + QUOTE_TTL_MS).toISOString(),
    router: tool,
    route: applePreviewRoute(token, quote.id, tool),
    output: { symbol: token, mint: mint.address, decimals: mint.decimals, amountAtomic: estimated.toAmount },
    minimumOutputAtomic: estimated.toAmountMin,
    idrxPerToken: price,
    feeCosts: feeCosts.items,
    gasCosts: gasCosts.items,
    costData: feeCosts.complete && gasCosts.complete ? "reported" : "partial",
  };
}

export function createAppleQuoteService({ fromAddress, apiKey, multichainPreview = false, fetcher = fetch, now = Date.now }: Options) {
  const cache = new Map<string, CacheEntry>();
  const inFlight = new Map<string, Promise<AppleQuoteResult>>();
  const rateLimit = { until: 0 };
  const getMultichainPreview = multichainPreview ? createAppleMultichainQuotePreview({ apiKey, fetcher, now, rateLimit }) : null;

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
        rateLimit.until = Math.max(rateLimit.until, now() + 1_000 * Math.max(3, Math.min(seconds || 3, 60)));
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
    if (rateLimit.until > now()) return Promise.resolve({ status: "unavailable", token, code: "RATE_LIMITED" });
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
    const [evaluation, multichain] = await Promise.all([
      selectAppleIssuer(amount, (token) => getQuote(token, amount), now, evidence),
      getMultichainPreview?.(amount),
    ]);
    return {
      source: "LI.FI",
      cluster: "solana-mainnet",
      mode: "quote-only",
      input: { symbol: "IDRX", mint: IDRX.address, decimals: IDRX.decimals, amountAtomic: amount },
      ...evaluation,
      ...(multichain && { multichain }),
    };
  }

  return { getAppleQuotes };
}
