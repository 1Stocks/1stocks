import {
  apple, tokenRegistry, type AppleBuyToken, type AppleIssuerEvaluation, type AppleIssuerSelection,
  type AppleIssuerToken, type AppleQuoteResult, type IssuerComparisonGap, type PurchaseRoute,
} from "@1stocks/shared";
import { catalog } from "../../../packages/asset-catalog/registry/catalog";
import { catalogDeploymentId, SOLANA_MAINNET, SOLANA_MAINNET_CHAIN_ID } from "../../../packages/asset-catalog/registry/networks";
import { eligibilityRouteKey, evaluatePurchaseEligibility, type EligibilityContext, type EligibilityEvidence } from "./purchase-eligibility";
import { formatIdrx, rankPurchaseOffers, type PurchaseOffer } from "./purchase-ranking";

type Quoted = Extract<AppleQuoteResult, { status: "quoted" }>;
type Quotable = Extract<AppleIssuerEvaluation, { status: "quotable" }>;

export type IssuerEvidence = {
  investor?: EligibilityContext["investor"];
  eligibility?: EligibilityEvidence;
  exposure?: {
    underlying: typeof apple.ticker;
    deploymentId: string;
    equivalenceGroup: string;
    sharesNumerator: string;
    sharesDenominator: string;
    source: string;
    expiresAt: number;
  };
  quoteCosts?: {
    routeKey: string;
    expiresAt: number;
    priceImpactBps: number;
    maxPriceImpactBps: number;
  };
};
export type AppleIssuerEvidence = Partial<Record<AppleBuyToken, IssuerEvidence>>;

const appleIsin = "US0378331005";
const appleProducts = catalog.find(asset => asset.id === appleIsin.toLowerCase())?.products ?? [];
const issuerNames = { AAPLx: "xstocks", AAPLon: "ondo", AAPLB: "bstocks" } as const;
const idrx = tokenRegistry.IDRX.solanaMainnet.mint;

function productFor(token: AppleIssuerToken) {
  return appleProducts.find(product => product.issuer === issuerNames[token] && product.symbol === token);
}

export function applePreviewRoute(token: AppleBuyToken, id: string, tool: string | null): PurchaseRoute {
  return {
    id, issuer: issuerNames[token], provider: "LI.FI", tool,
    funding: { chainId: SOLANA_MAINNET_CHAIN_ID, address: idrx.address },
    deployment: { chainId: SOLANA_MAINNET_CHAIN_ID, address: tokenRegistry[token].solanaMainnet.mint.address },
  };
}

function supportsApplePreview(token: AppleIssuerToken): token is AppleBuyToken {
  const registry = tokenRegistry[token];
  return registry.supportsAppleQuotePreview && registry.solanaMainnet.status === "verified" &&
    productFor(token)?.deployments.some(deployment =>
      deployment.chain === SOLANA_MAINNET && deployment.address === registry.solanaMainnet.mint?.address
    ) === true;
}

function contextFor(token: AppleIssuerToken, evidence?: IssuerEvidence, route?: PurchaseRoute): EligibilityContext {
  const registry = tokenRegistry[token].solanaMainnet;
  const deployment = productFor(token)?.deployments.find(item =>
    registry.status === "verified" ? item.chain === SOLANA_MAINNET && item.address === registry.mint.address : true
  );
  return {
    issuer: issuerNames[token], jurisdiction: "ID",
    deploymentId: deployment ? catalogDeploymentId(deployment.chain, deployment.address) : "",
    investor: evidence?.investor,
    routeKey: route && eligibilityRouteKey(route),
  };
}

function verifiedExposure(context: EligibilityContext, evidence: IssuerEvidence | undefined, now: number) {
  const exposure = evidence?.exposure;
  if (!exposure || !(exposure.expiresAt > now) || exposure.underlying !== apple.ticker ||
      exposure.deploymentId !== context.deploymentId || !exposure.equivalenceGroup.trim() ||
      URL.parse(exposure.source)?.protocol !== "https:" ||
      !/^[1-9]\d{0,29}$/.test(exposure.sharesNumerator) ||
      !/^[1-9]\d{0,29}$/.test(exposure.sharesDenominator)) return null;
  return exposure;
}

function totalIdrxCost(input: string, quote: Quoted) {
  let total = BigInt(input);
  for (const fee of [...quote.feeCosts, ...quote.gasCosts]) {
    const value = BigInt(fee.amount.amountAtomic);
    if (value === 0n || fee.included === true) continue;
    if (fee.included !== false || fee.amount.mint !== idrx.address || fee.amount.decimals !== idrx.decimals) return null;
    total += value;
  }
  return total;
}

export async function selectAppleIssuer(
  amount: string,
  getQuote: (token: AppleBuyToken) => Promise<AppleQuoteResult>,
  now: () => number,
  evidence: AppleIssuerEvidence = {},
): Promise<{ quotes: AppleQuoteResult[]; selection: AppleIssuerSelection }> {
  const beforeFetch = now();
  const requested: AppleBuyToken[] = [];
  const excluded = new Map<AppleIssuerToken, Extract<AppleIssuerEvaluation, { status: "excluded" }>["reason"]>();

  for (const token of apple.issuerTokens) {
    const attestation = token === "AAPLB" ? undefined : evidence[token];
    const eligibility = evaluatePurchaseEligibility(contextFor(token, attestation), beforeFetch, attestation?.eligibility);
    if (eligibility.reason === "ISSUER_RESTRICTS_INDONESIA") {
      excluded.set(token, "JURISDICTION_RESTRICTED");
    } else if (eligibility.status === "RESTRICTED" || productFor(token)?.halted) {
      excluded.set(token, "PRODUCT_RESTRICTED");
    } else if (supportsApplePreview(token)) {
      requested.push(token);
    } else {
      excluded.set(token, "UNSUPPORTED_SOLANA");
    }
  }

  const quotes = await Promise.all(requested.map(getQuote));
  const current = now();
  const candidates: AppleIssuerEvaluation[] = [];
  const offers: PurchaseOffer[] = [];

  for (const token of apple.issuerTokens) {
    const reason = excluded.get(token);
    if (reason || token === "AAPLB") {
      candidates.push({ token, status: "excluded", reason: reason ?? "UPSTREAM_ERROR" });
      continue;
    }
    const quote = quotes.find(item => item.token === token);
    if (!quote || quote.status === "unavailable") {
      candidates.push({ token, status: "excluded", reason: quote?.code ?? "UPSTREAM_ERROR" });
      continue;
    }
    if (!(Date.parse(quote.expiresAt) > current)) {
      candidates.push({ token, status: "excluded", reason: "QUOTE_EXPIRED" });
      continue;
    }

    const route = applePreviewRoute(token, quote.quoteId, quote.router);
    const attestation = evidence[token];
    const context = contextFor(token, attestation, route);
    const eligibility = evaluatePurchaseEligibility(context, current, attestation?.eligibility);
    if (eligibility.status === "RESTRICTED") {
      candidates.push({ token, status: "excluded", reason: "PRODUCT_RESTRICTED" });
      continue;
    }

    const exposure = verifiedExposure(context, attestation, current);
    const quoteCosts = attestation?.quoteCosts;
    const verifiedCosts = quoteCosts && quoteCosts.routeKey === context.routeKey && quoteCosts.expiresAt > current ? quoteCosts : null;
    const cost = verifiedCosts ? totalIdrxCost(amount, quote) : null;
    const output = BigInt(quote.output.amountAtomic);
    const minimum = BigInt(quote.minimumOutputAtomic);
    const gaps: IssuerComparisonGap[] = [];
    if (eligibility.status !== "ELIGIBLE") gaps.push("ELIGIBILITY_UNVERIFIED");
    if (!exposure) gaps.push("EXPOSURE_UNVERIFIED");
    if (cost === null || minimum === 0n) gaps.push("COST_INCOMPLETE");
    if (cost !== null && cost > BigInt(amount)) gaps.push("BUDGET_EXCEEDED");
    if (verifiedCosts && verifiedCosts.priceImpactBps > verifiedCosts.maxPriceImpactBps) {
      gaps.push("PRICE_IMPACT_EXCEEDED");
    }
    candidates.push({
      token, status: "quotable", quoteId: quote.quoteId, gaps,
      productEligibility: eligibility.status === "ELIGIBLE" ? "verified" : "unverified",
      receiveBufferBps: Number((output - minimum) * 10_000n / output),
    });
    offers.push({
      route, eligibility: eligibility.status, budget: { unit: "IDRX", amountAtomic: amount },
      economics: exposure && verifiedCosts && cost !== null ? {
        totalCostAtomic: cost.toString(),
        outputAtomic: quote.output.amountAtomic, minimumAtomic: quote.minimumOutputAtomic, outputDecimals: quote.output.decimals,
        priceImpactBps: verifiedCosts.priceImpactBps, maxPriceImpactBps: verifiedCosts.maxPriceImpactBps,
        issuerExposure: { instrument: appleIsin, equivalenceGroup: exposure.equivalenceGroup,
          numerator: exposure.sharesNumerator, denominator: exposure.sharesDenominator },
      } : null,
    });
  }

  const quotable = candidates.filter((candidate): candidate is Quotable => candidate.status === "quotable");
  const shownQuotes = quotes.filter(quote => !candidates.some(candidate =>
    candidate.token === quote.token && candidate.status === "excluded" && candidate.reason === "PRODUCT_RESTRICTED"
  ));
  const unavailable = (reason: Extract<AppleIssuerSelection["decision"], { status: "unavailable" }>["reason"]) =>
    ({ quotes: shownQuotes, selection: { candidates, decision: { status: "unavailable", reason } } }) as const;
  if (quotable.length === 0) return unavailable("NO_FRESH_ROUTES");
  if (quotable.length === 1) {
    const [{ token, quoteId }] = quotable;
    return { quotes: shownQuotes, selection: { candidates, decision: { status: "only_quotable", token, quoteId, reason: "ONLY_FRESH_ROUTE" } } };
  }

  const ranking = rankPurchaseOffers(offers);
  for (const { offer, estimated, atMinimum } of ranking.compared) {
    const candidate = quotable.find(entry => entry.quoteId === offer.route.id && issuerNames[entry.token] === offer.route.issuer);
    if (candidate) candidate.costPerShare = { estimated: formatIdrx(estimated), atMinimumReceived: formatIdrx(atMinimum) };
  }
  if (ranking.status === "unavailable") return unavailable(ranking.reason);
  const winner = quotable.find(candidate =>
    candidate.quoteId === ranking.winner.id && issuerNames[candidate.token] === ranking.winner.issuer);
  if (!winner) return unavailable("MISSING_COMPARISON_DATA");
  return {
    quotes: shownQuotes, selection: { candidates, decision: { status: "recommended", token: winner.token,
      quoteId: winner.quoteId, route: ranking.winner, reason: "LOWEST_VERIFIED_EXECUTION_COST" } },
  };
}
