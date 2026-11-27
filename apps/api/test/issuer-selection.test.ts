import assert from "node:assert/strict";
import test from "node:test";
import { tokenRegistry, type AppleBuyToken, type AppleQuoteResult, type QuoteFee } from "@1stocks/shared";
import { selectAppleIssuer, type AppleIssuerEvidence, type IssuerEvidence } from "../src/issuer-selection";

const now = 1_000;
const amount = "10000000";
const registry = tokenRegistry.IDRX.solanaMainnet.mint;

function quote(token: AppleBuyToken, output: string, minimum = output, fees: QuoteFee[] = []): AppleQuoteResult {
  const mint = tokenRegistry[token].solanaMainnet.mint;
  return {
    token, status: "quoted", quoteId: `test-${token}`,
    fetchedAt: new Date(now).toISOString(), expiresAt: new Date(30_000).toISOString(),
    router: "test-router", idrxPerToken: "0", feeCosts: fees, gasCosts: [],
    output: { symbol: token, mint: mint.address, decimals: mint.decimals, amountAtomic: output },
    minimumOutputAtomic: minimum,
  };
}

function verified(token: AppleBuyToken, numerator = "1"): IssuerEvidence {
  return {
    eligibility: { status: "verified", expiresAt: 20_000 },
    exposure: {
      underlying: "AAPL", mint: tokenRegistry[token].solanaMainnet.mint.address, equivalenceGroup: "test-model",
      sharesNumerator: numerator, sharesDenominator: "1", expiresAt: 20_000,
    },
    completeFees: true,
  };
}

const complete: AppleIssuerEvidence = { AAPLx: verified("AAPLx"), AAPLon: verified("AAPLon") };

test("excludes unsupported and restricted products before calling the quote provider", async () => {
  const requested: AppleBuyToken[] = [];
  const { quotes, selection } = await selectAppleIssuer(amount, async (token) => {
    requested.push(token);
    return quote(token, "20000000");
  }, () => now, { AAPLx: { eligibility: { status: "restricted", expiresAt: 20_000 } } });
  assert.deepEqual(requested, ["AAPLon"]);
  assert.equal(quotes.length, 1);
  assert.deepEqual(selection.decision, {
    status: "only_quotable", token: "AAPLon", quoteId: "test-AAPLon", reason: "ONLY_FRESH_ROUTE",
  });
  assert.deepEqual(selection.candidates[0], { token: "AAPLx", status: "excluded", reason: "PRODUCT_RESTRICTED" });
  assert.deepEqual(selection.candidates[2], { token: "AAPLB", status: "excluded", reason: "UNSUPPORTED_SOLANA" });
});

test("evaluates both products and never picks a default when evidence is incomplete", async () => {
  const { quotes, selection } = await selectAppleIssuer(amount, async (token) => quote(token, "20000000"), () => now);
  assert.deepEqual(quotes.map(({ token }) => token), ["AAPLx", "AAPLon"]);
  assert.deepEqual(selection.decision, { status: "unavailable", reason: "MISSING_COMPARISON_DATA" });
  assert.ok(selection.candidates.every((candidate) =>
    candidate.status === "excluded" || candidate.gaps.includes("ELIGIBILITY_UNVERIFIED")));
});

test("uses normalized share exposure and verified external fees to change the recommendation with order size", async () => {
  const fee: QuoteFee = {
    name: "test fee", included: false,
    amount: { symbol: "IDRX", mint: registry.address, decimals: registry.decimals, amountAtomic: "250000" },
  };
  const evidence = { ...complete, AAPLon: verified("AAPLon", "2") };
  const evaluate = (input: string) => selectAppleIssuer(input, async (token) => {
    if (input === amount) return token === "AAPLx"
      ? quote(token, "4000000", "3980000")
      : quote(token, "20100000", "20000000", [fee]);
    return token === "AAPLx" ? quote(token, "38000000", "37800000") : quote(token, "210000000", "208000000", [fee]);
  }, () => now, evidence);
  const small = await evaluate(amount);
  assert.deepEqual(small.selection.decision, {
    status: "recommended", token: "AAPLx", quoteId: "test-AAPLx", reason: "LOWEST_VERIFIED_EXECUTION_COST",
  });
  const large = await evaluate("100000000");
  assert.deepEqual(large.selection.decision, {
    status: "recommended", token: "AAPLon", quoteId: "test-AAPLon", reason: "LOWEST_VERIFIED_EXECUTION_COST",
  });
});

test("does not rank products with unmatched exposure evidence or unpriced network fees", async () => {
  const other = verified("AAPLon");
  assert.ok(other.exposure);
  const different = await selectAppleIssuer(amount, async (token) => quote(token, "20000000"), () => now, {
    ...complete, AAPLon: { ...other, exposure: { ...other.exposure, equivalenceGroup: "different" } },
  });
  assert.deepEqual(different.selection.decision, { status: "unavailable", reason: "INCOMPARABLE_PRODUCTS" });

  const sol: QuoteFee = {
    name: "network fee", included: false,
    amount: { symbol: "SOL", mint: "11111111111111111111111111111111", decimals: 9, amountAtomic: "10000" },
  };
  const unpriced = await selectAppleIssuer(amount, async (token) => quote(token, "20000000", "20000000", [sol]), () => now, complete);
  assert.deepEqual(unpriced.selection.decision, { status: "unavailable", reason: "MISSING_COMPARISON_DATA" });
});

test("reports ties and overlapping execution costs without choosing a winner", async () => {
  const evaluate = (output: string, minimum: string) => selectAppleIssuer(amount, async (token) =>
    token === "AAPLx" ? quote(token, output, minimum) : quote(token, "20000000", "19750000"), () => now, complete);
  assert.deepEqual((await evaluate("2000000", "1980000")).selection.decision, { status: "unavailable", reason: "COST_TIE" });
  assert.deepEqual((await evaluate("2010000", "1990000")).selection.decision, { status: "unavailable", reason: "COST_RANGES_OVERLAP" });
});

test("reports unavailable when no issuer has a fresh quote", async () => {
  const { selection } = await selectAppleIssuer(amount, async (token) =>
    token === "AAPLx" ? { status: "unavailable", token, code: "NO_ROUTE" } : quote(token, "20000000"),
  () => 30_000, complete);
  assert.deepEqual(selection.decision, { status: "unavailable", reason: "NO_FRESH_ROUTES" });
  assert.deepEqual(selection.candidates.slice(0, 2), [
    { token: "AAPLx", status: "excluded", reason: "NO_ROUTE" },
    { token: "AAPLon", status: "excluded", reason: "QUOTE_EXPIRED" },
  ]);
});
