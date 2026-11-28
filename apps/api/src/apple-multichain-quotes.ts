import {
  SOLANA_MAINNET_LIFI_CHAIN_ID as solana, tokenRegistry, type AppleBuyToken, type AppleMultichainOffer,
  type AppleMultichainPreview, type AppleQuoteNetwork, type QuoteErrorCode, type QuoteFee,
} from "@1stocks/shared";
import { catalog, catalogAvailability } from "../../../packages/asset-catalog/registry/catalog";
import { issuerJurisdictionPolicy } from "../../../packages/asset-catalog/registry/issuer-policies";
import { SOLANA_MAINNET, SOLANA_MAINNET_CHAIN_ID } from "../../../packages/asset-catalog/registry/networks";
import { isAtomic, normalizeLifiFees } from "./lifi-quote-data";

const routesUrl = "https://li.quest/v1/advanced/routes";
const ttlMs = 25_000;
const networks = {
  [solana]: { key: SOLANA_MAINNET, id: SOLANA_MAINNET_CHAIN_ID, name: "Solana" },
  1: { key: "eip155:1", id: "eip155:1", name: "Ethereum" },
  56: { key: "eip155:56", id: "eip155:56", name: "BNB Smart Chain" },
} as const;
type Chain = keyof typeof networks;
type RouteToken = { chainId: Chain; address: string; decimals: number };

const usdc = {
  [solana]: { chainId: solana, ...tokenRegistry.USDC.solanaMainnet.mint },
  1: { chainId: 1, address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", decimals: 6 },
  56: { chainId: 56, address: "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", decimals: 18 },
} as const satisfies Record<Chain, RouteToken>;
const idrx = { chainId: solana, ...tokenRegistry.IDRX.solanaMainnet.mint } as const;
const targets = [
  { token: "AAPLx", issuer: "xstocks", chainId: solana, ...tokenRegistry.AAPLx.solanaMainnet.mint },
  { token: "AAPLx", issuer: "xstocks", chainId: 1, address: "0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a", decimals: 18 },
  { token: "AAPLon", issuer: "ondo", chainId: solana, ...tokenRegistry.AAPLon.solanaMainnet.mint },
  { token: "AAPLon", issuer: "ondo", chainId: 1, address: "0x14c3abf95cb9c93a8b82c1cdcb76d72cb87b2d4c", decimals: 18 },
  { token: "AAPLon", issuer: "ondo", chainId: 56, address: "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4", decimals: 18 },
] as const satisfies readonly (RouteToken & { token: AppleBuyToken; issuer: "xstocks" | "ondo" })[];

const appleProducts = catalog.find(item => item.id === "us0378331005")?.products ?? [];

type LifiToken = { address?: unknown; chainId?: unknown; decimals?: unknown };
type LifiStep = {
  tool?: unknown;
  action?: { fromChainId?: unknown; toChainId?: unknown; fromToken?: LifiToken; toToken?: LifiToken };
  estimate?: { feeCosts?: unknown; gasCosts?: unknown };
  includedSteps?: LifiStep[];
};
type LifiRoute = {
  id?: unknown;
  fromChainId?: unknown;
  toChainId?: unknown;
  fromToken?: LifiToken;
  toToken?: LifiToken;
  fromAmount?: unknown;
  toAmount?: unknown;
  toAmountMin?: unknown;
  steps?: (LifiStep | null)[];
};

function addressMatches(chain: Chain, actual: unknown, expected: unknown) {
  return typeof actual === "string" && typeof expected === "string" &&
    (chain === solana ? actual === expected : actual.toLowerCase() === expected.toLowerCase());
}

function tokenMatches(token: LifiToken | undefined, expected: RouteToken) {
  return token?.chainId === expected.chainId && token.decimals === expected.decimals &&
    addressMatches(expected.chainId, token.address, expected.address);
}

function normalizeRoute(raw: LifiRoute, from: RouteToken, to: RouteToken, amount: string) {
  if (typeof raw?.id !== "string" || !raw.id.trim() || raw.id.length > 128 ||
      raw.fromChainId !== from.chainId || raw.toChainId !== to.chainId ||
      !tokenMatches(raw.fromToken, from) || !tokenMatches(raw.toToken, to) || raw.fromAmount !== amount ||
      !isAtomic(raw.toAmount) || !isAtomic(raw.toAmountMin) ||
      BigInt(raw.toAmountMin) === 0n || BigInt(raw.toAmountMin) > BigInt(raw.toAmount) ||
      !Array.isArray(raw.steps) || raw.steps.length === 0 || raw.steps.length > 8) return null;

  const chains: Chain[] = [from.chainId, to.chainId];
  const allowedChain = (chain: unknown) => chains.some(known => known === chain);
  const feeCosts: QuoteFee[] = [];
  const gasCosts: QuoteFee[] = [];
  const tools = new Set<string>();
  let complete = true;
  let previous = from;
  for (const step of raw.steps) {
    const action = step?.action;
    const destinationChain = chains.find(chain => chain === action?.toChainId);
    if (!step || !action || action.fromChainId !== previous.chainId || destinationChain === undefined ||
        !tokenMatches(action.fromToken, previous) || action.toToken?.chainId !== destinationChain ||
        typeof action.toToken.address !== "string" || typeof action.toToken.decimals !== "number" ||
        !Number.isInteger(action.toToken.decimals) || action.toToken.decimals < 0 || action.toToken.decimals > 255 ||
        (step.includedSteps !== undefined && (!Array.isArray(step.includedSteps) ||
          !step.includedSteps.every(inner => allowedChain(inner?.action?.fromChainId) && allowedChain(inner?.action?.toChainId))))) {
      return null;
    }
    previous = { chainId: destinationChain, address: action.toToken.address, decimals: action.toToken.decimals };
    if (typeof step.tool === "string" && /^[a-z0-9_-]{1,60}$/i.test(step.tool)) tools.add(step.tool);
    // LI.FI exposes aggregate fee lines on each top-level step. Included steps can repeat those costs.
    const fees = normalizeLifiFees(step.estimate?.feeCosts, chains, "fee");
    const gas = normalizeLifiFees(step.estimate?.gasCosts, chains, "gas");
    feeCosts.push(...fees.items);
    gasCosts.push(...gas.items);
    complete &&= fees.complete && gas.complete;
  }
  if (!tokenMatches(previous, to)) return null;
  return {
    id: raw.id, tool: [...tools].join(" + ") || null, expected: raw.toAmount, minimum: raw.toAmountMin,
    feeCosts, gasCosts, costData: complete ? "reported" : "partial",
  } as const;
}

type RouteResult = { route: NonNullable<ReturnType<typeof normalizeRoute>>; fetchedAt: number } | { code: QuoteErrorCode };
type Options = {
  apiKey?: string;
  fetcher: typeof fetch;
  now: () => number;
  rateLimit: { until: number };
};

export function createAppleMultichainQuotePreview({ apiKey, fetcher, now, rateLimit }: Options) {
  const cache = new Map<string, { preview: AppleMultichainPreview; until: number }>();
  const active = new Map<string, Promise<AppleMultichainPreview>>();

  async function request(from: RouteToken, to: RouteToken, amount: string, signal: AbortSignal): Promise<RouteResult> {
    if (now() < rateLimit.until) return { code: "RATE_LIMITED" };
    try {
      const response = await fetcher(routesUrl, {
        method: "POST", cache: "no-store", signal,
        headers: { "content-type": "application/json", ...(apiKey && { "x-lifi-api-key": apiKey }) },
        body: JSON.stringify({
          fromChainId: from.chainId, toChainId: to.chainId,
          fromTokenAddress: from.address, toTokenAddress: to.address,
          fromAmount: amount, options: { order: "RECOMMENDED" },
        }),
      });
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after"));
        rateLimit.until = Math.max(rateLimit.until, now() + 1_000 * Math.max(3, Math.min(retryAfter || 3, 60)));
        return { code: "RATE_LIMITED" };
      }
      if (!response.ok) return { code: "UPSTREAM_ERROR" };
      const payload = await response.json() as { routes?: unknown } | null;
      if (!Array.isArray(payload?.routes)) return { code: "UPSTREAM_ERROR" };
      if (payload.routes.length === 0) return { code: "NO_ROUTE" };
      for (const candidate of payload.routes.slice(0, 20)) {
        const route = normalizeRoute(candidate, from, to, amount);
        if (route) return { route, fetchedAt: now() };
      }
      return { code: "UPSTREAM_ERROR" };
    } catch (error) {
      return { code: signal.aborted || (error instanceof Error && error.name === "TimeoutError") ? "TIMEOUT" : "UPSTREAM_ERROR" };
    }
  }

  function unavailable(code: QuoteErrorCode): AppleMultichainPreview {
    return {
      mode: "indicative", productionEligibility: "UNKNOWN", benchmark: null,
      offers: targets.map(({ token, chainId }) => ({ token, network: networks[chainId].name, status: "unavailable", code })),
    };
  }

  async function load(amount: string): Promise<AppleMultichainPreview> {
    const signal = AbortSignal.timeout(9_000);
    const conversion = await request(idrx, usdc[solana], amount, signal);
    if ("code" in conversion) return unavailable(conversion.code);

    const minimumUsdcAtomic = conversion.route.minimum;
    const unit = 10n ** BigInt(usdc[solana].decimals);
    const minimum = BigInt(minimumUsdcAtomic);
    const wholeUnits = minimum / unit * unit;
    const comparisonUsdcAtomic = (wholeUnits || minimum).toString();
    const deadline = conversion.fetchedAt + ttlMs;
    const benchmark = {
      minimumUsdcAtomic, comparisonUsdcAtomic,
      fetchedAt: new Date(conversion.fetchedAt).toISOString(),
      expiresAt: new Date(deadline).toISOString(),
    };
    const offers = await Promise.all(targets.map(async (target): Promise<AppleMultichainOffer> => {
      const { token, issuer, chainId } = target;
      const network: AppleQuoteNetwork = networks[chainId].name;
      const product = appleProducts.find(entry => entry.issuer === issuer && entry.symbol === token);
      if (issuerJurisdictionPolicy(issuer, "ID").status === "RESTRICTED" || !product ||
          ["stale", "restricted"].includes(catalogAvailability(product, now())) ||
          !product.deployments.some(deployment => deployment.chain === networks[chainId].key &&
            addressMatches(chainId, deployment.address, target.address))) {
        return { token, network, status: "unavailable", code: "NO_ROUTE" };
      }

      let source: RouteToken = usdc[solana];
      let fundingBasis: Extract<AppleMultichainOffer, { status: "quoted" }>["fundingBasis"] = "solana-usdc";
      let fundingAtomic = comparisonUsdcAtomic;
      let result = await request(source, target, fundingAtomic, signal);
      if ("code" in result && result.code === "NO_ROUTE" && chainId !== solana) {
        source = usdc[chainId];
        fundingBasis = chainId === 56 ? "bnb-prefunded-binance-peg-usdc" : "ethereum-prefunded-usdc";
        fundingAtomic = (BigInt(comparisonUsdcAtomic) * 10n ** BigInt(source.decimals - usdc[solana].decimals)).toString();
        result = await request(source, target, fundingAtomic, signal);
      }
      if ("code" in result) return { token, network, status: "unavailable", code: result.code };

      return {
        token, network, status: "quoted", fundingBasis,
        route: {
          id: result.route.id, issuer, provider: "LI.FI", tool: result.route.tool,
          funding: { chainId: networks[source.chainId].id, address: source.address },
          deployment: { chainId: networks[chainId].id, address: target.address },
        },
        funding: { symbol: "USDC", mint: source.address, decimals: source.decimals, amountAtomic: fundingAtomic },
        output: { symbol: token, mint: target.address, decimals: target.decimals, amountAtomic: result.route.expected },
        minimumOutputAtomic: result.route.minimum, feeCosts: result.route.feeCosts, gasCosts: result.route.gasCosts,
        costData: result.route.costData, fetchedAt: new Date(result.fetchedAt).toISOString(), expiresAt: benchmark.expiresAt,
      };
    }));
    return { mode: "indicative", productionEligibility: "UNKNOWN", benchmark, offers };
  }

  return function getPreview(amount: string): Promise<AppleMultichainPreview> {
    const hit = cache.get(amount);
    if (hit && hit.until > now()) return Promise.resolve(hit.preview);
    const pending = active.get(amount);
    if (pending) return pending;
    if (active.size >= 2) return Promise.resolve(unavailable("BUSY"));

    const result = load(amount).then(preview => {
      if (cache.size >= 64) {
        const oldest = cache.keys().next();
        if (!oldest.done) cache.delete(oldest.value);
      }
      const until = preview.benchmark ? Date.parse(preview.benchmark.expiresAt) : now() + 3_000;
      cache.set(amount, { preview, until });
      return preview;
    }).finally(() => active.delete(amount));
    active.set(amount, result);
    return result;
  };
}
