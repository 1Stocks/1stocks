import assert from "node:assert/strict";
import test from "node:test";
import { eligibilityRouteKey, eligibilityScopes, evaluatePurchaseEligibility, type EligibilityContext } from "../src/purchase-eligibility";
import { rankPurchaseOffers, type PurchaseOffer } from "../src/purchase-ranking";

const now = Date.parse("2026-11-28T08:00:00Z");
const scope: EligibilityContext = {
  issuer: "bstocks", jurisdiction: " id ", deploymentId: "eip155:56:0x431a3bee82e2ca41e49895cbece5bb0f76a89b7a",
  investor: { id: "verified-investor", wallet: "investor-wallet" }, routeKey: "route-on-bnb",
};

function approval(context: EligibilityContext) {
  const scopes = eligibilityScopes(context);
  function proof(key: keyof typeof scopes) {
    const scoped = scopes[key];
    assert.ok(scoped);
    return { scope: scoped, status: "ELIGIBLE", source: "https://evidence.example/scope", verifiedAt: now - 1, expiresAt: now + 1 } as const;
  }
  return { issuerPolicy: proof("issuerPolicy"), investor: proof("investor"), distribution: proof("distribution"), execution: proof("execution") };
}

test("published country restriction takes precedence over listing, investor, distribution, and route confirmations", () => {
  const result = evaluatePurchaseEligibility(scope, now, approval(scope));
  assert.equal(result.status, "RESTRICTED");
  assert.equal(result.checks.issuerPolicy, "RESTRICTED");
  assert.equal(result.reason, "ISSUER_RESTRICTS_INDONESIA");
  const otherDeployment = { ...scope, deploymentId: "eip155:1:other-verified-contract" };
  assert.equal(evaluatePurchaseEligibility(otherDeployment, now).status, "RESTRICTED");
});

test("requires all four fresh, context-bound confirmations before ranking an execution route", () => {
  const context = { ...scope, issuer: "ondo" as const, jurisdiction: "ID" };
  const proofs = approval(context);
  assert.equal(evaluatePurchaseEligibility(context, now, proofs).status, "ELIGIBLE");

  const { distribution, ...partial } = proofs;
  assert.ok(distribution);
  assert.equal(evaluatePurchaseEligibility(context, now, partial).status, "VERIFICATION_REQUIRED");
  assert.equal(evaluatePurchaseEligibility({ ...context, investor: undefined }, now, proofs).checks.investor, "VERIFICATION_REQUIRED");
  assert.equal(evaluatePurchaseEligibility({ ...context, investor: { id: "verified-investor", wallet: "other-wallet" } }, now, proofs).checks.execution, "VERIFICATION_REQUIRED");
  assert.equal(evaluatePurchaseEligibility({ ...context, routeKey: "new-provider" }, now, proofs).checks.execution, "VERIFICATION_REQUIRED");
  assert.equal(evaluatePurchaseEligibility({ ...context, jurisdiction: "GB" }, now, proofs).status, "VERIFICATION_REQUIRED");
  assert.equal(evaluatePurchaseEligibility(context, now + 1, proofs).status, "VERIFICATION_REQUIRED");
  assert.equal(evaluatePurchaseEligibility(context, now).status, "UNKNOWN");
});

function offer(
  issuer: PurchaseOffer["route"]["issuer"], fromChain: string, toChain: string,
  outputAtomic: string, sharesNumerator: string,
): PurchaseOffer {
  return {
    route: {
      id: issuer + "-quote", issuer, provider: "fixture-provider", tool: "fixture-tool",
      funding: { chainId: fromChain, address: "funding-fixture" },
      deployment: { chainId: toChain, address: "token-fixture" },
    },
    eligibility: "ELIGIBLE", budget: { unit: "IDR", amountAtomic: "10000" },
    economics: {
      totalCostAtomic: "10000", outputAtomic, minimumAtomic: outputAtomic, outputDecimals: 8,
      priceImpactBps: 15, maxPriceImpactBps: 100,
      issuerExposure: { instrument: "US0378331005", equivalenceGroup: "fixture-group", numerator: sharesNumerator, denominator: "1" },
    },
  };
}

test("compares equivalent exposure and retains the full winning route without a chain preference", () => {
  const eth = offer("ondo", "eip155:56", "eip155:1", "60", "2");
  const sol = offer("xstocks", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp", "100", "1");
  const ethWins = rankPurchaseOffers([sol, eth]);
  assert.equal(ethWins.status, "recommended");
  assert.equal(ethWins.winner, eth.route);
  const slippageAdjusted = offer("ondo", "eip155:56", "eip155:1", "42", "2");
  const solWins = rankPurchaseOffers([slippageAdjusted, sol]);
  assert.equal(solWins.status, "recommended");
  assert.equal(solWins.winner, sol.route);
  assert.notEqual(eligibilityRouteKey(eth.route), eligibilityRouteKey({ ...eth.route, provider: "other" }));
});

test("ignores restricted or unknown candidates and abstains for incomparable budgets or missing costs", () => {
  const candidate = offer("xstocks", "eip155:1", "eip155:1", "100", "1");
  const cheaper = offer("ondo", "eip155:56", "eip155:56", "200", "2");
  for (const eligibility of ["RESTRICTED", "UNKNOWN", "VERIFICATION_REQUIRED"] as const) {
    const result = rankPurchaseOffers([candidate, { ...cheaper, eligibility }]);
    assert.equal(result.status, "recommended");
    assert.equal(result.winner, candidate.route);
  }
  const different = rankPurchaseOffers([candidate, { ...cheaper, budget: { ...cheaper.budget, amountAtomic: "20000" } }]);
  assert.equal(different.status, "unavailable");
  assert.equal(different.reason, "INCOMPARABLE_PRODUCTS");
  const incomplete = rankPurchaseOffers([candidate, { ...cheaper, economics: null }]);
  assert.equal(incomplete.status, "unavailable");
  assert.equal(incomplete.reason, "MISSING_COMPARISON_DATA");

  assert.ok(cheaper.economics);
  const impact = rankPurchaseOffers([candidate, { ...cheaper, economics: { ...cheaper.economics, priceImpactBps: 101 } }]);
  assert.equal(impact.status, "unavailable");
  assert.equal(impact.reason, "MISSING_COMPARISON_DATA");
});
