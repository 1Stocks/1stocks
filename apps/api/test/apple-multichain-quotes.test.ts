import assert from "node:assert/strict";
import test from "node:test";
import { SOLANA_MAINNET_LIFI_CHAIN_ID as solana, tokenRegistry, type AppleQuotesResponse } from "@1stocks/shared";
import { createAppleMultichainQuotePreview } from "../src/apple-multichain-quotes";
import { analysisEvidence, explainIssuers } from "../src/issuer-analysis";

const timestamp = Date.parse("2026-11-28T04:00:00Z");
const idrx = tokenRegistry.IDRX.solanaMainnet.mint.address;
const usdcSol = tokenRegistry.USDC.solanaMainnet.mint.address;
const usdcEth = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";
const usdcBnb = "0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d";
const aaplxEth = "0x9d275685dc284c8eb1c79f6aba7a63dc75ec890a";
const aaplonBnb = "0x390a684ef9cade28a7ad0dfa61ab1eb3842618c4";
const amount = "20000000";
const minimum = "10500000";
const budget = "10000000";

type RequestData = {
  fromChainId: number; toChainId: number;
  fromTokenAddress: string; toTokenAddress: string; fromAmount: string;
};

function lifiFixture(params: RequestData) {
  const { fromChainId, toChainId, fromTokenAddress, toTokenAddress, fromAmount } = params;
  const fromToken = { chainId: fromChainId, address: fromTokenAddress,
    decimals: fromTokenAddress === idrx ? 2 : fromTokenAddress === usdcBnb ? 18 : 6 };
  const toToken = { chainId: toChainId, address: toTokenAddress, decimals: toChainId === solana
    ? toTokenAddress === usdcSol ? 6 : toTokenAddress === tokenRegistry.AAPLx.solanaMainnet.mint.address ? 8 : 9
    : 18 };
  const action = { fromChainId, toChainId, fromToken, toToken };
  const fee = { type: "fee", name: "LI.FI", included: true, amount: "5000",
    amountUSD: "0.005", token: { ...fromToken, symbol: "USDC" } };
  return {
    id: "fixture-" + toTokenAddress, ...action, fromAmount, toAmount: "11000000", toAmountMin: minimum,
    steps: [{
      tool: "fixture-router", action, estimate: { feeCosts: [fee], gasCosts: [{
        type: "SEND", amount: "5000", amountUSD: "0.009", token: { ...fromToken, symbol: "GAS" },
      }] }, includedSteps: [{ action, estimate: { feeCosts: [fee] } }],
    }],
    transactionRequest: { data: "must-not-return-calldata" },
  };
}

function setup(replay = (params: RequestData) => lifiFixture(params)) {
  const sent: RequestData[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(String(url), "https://li.quest/v1/advanced/routes");
    assert.equal(init?.method, "POST");
    const params = JSON.parse(String(init.body));
    assert.equal(params.fromAddress, undefined);
    assert.equal(params.toAddress, undefined);
    assert.notEqual(params.toTokenAddress, "0x431a3bee82e2ca41e49895cbece5bb0f76a89b7a");
    sent.push(params);
    if (params.fromChainId === solana && [aaplxEth, aaplonBnb].includes(params.toTokenAddress)) {
      return Response.json({ routes: [] });
    }
    return Response.json({ routes: [replay(params)] });
  };
  return { sent, get: createAppleMultichainQuotePreview({ fetcher, now: () => timestamp, rateLimit: { until: 0 } }) };
}

test("multichain quote preview binds all routes to the conversion benchmark and labels prefunded fallbacks", async () => {
  const { sent, get } = setup();
  const [preview, repeated] = await Promise.all([get(amount), get(amount)]);
  assert.equal(preview, repeated);
  assert.equal(await get(amount), preview);
  assert.equal(preview.mode, "indicative");
  assert.equal(preview.productionEligibility, "UNKNOWN");
  assert.equal(preview.benchmark?.minimumUsdcAtomic, minimum);
  assert.equal(preview.benchmark?.comparisonUsdcAtomic, budget);
  assert.equal(preview.offers.length, 5);
  assert.equal(sent.length, 8);
  assert.ok(sent.filter(item => item.fromTokenAddress === usdcSol).every(item => item.fromAmount === budget));
  assert.ok(sent.some(item => item.fromTokenAddress === usdcEth && item.fromAmount === budget));
  assert.ok(sent.some(item => item.fromTokenAddress === usdcBnb && item.fromAmount === "10000000000000000000"));
  assert.deepEqual(preview.offers.map(offer => offer.status === "quoted" ? offer.fundingBasis : null), [
    "solana-usdc", "ethereum-prefunded-usdc", "solana-usdc", "solana-usdc", "bnb-prefunded-binance-peg-usdc",
  ]);
  for (const offer of preview.offers) {
    assert.equal(offer.status, "quoted");
    assert.equal(offer.costData, "reported");
    assert.equal(offer.feeCosts.length, 1);
    assert.equal(offer.expiresAt, preview.benchmark?.expiresAt);
  }
  assert.doesNotMatch(JSON.stringify(preview), /must-not-return-calldata/);
});

test("rejects wrong output units, funding amount, or chain and marks incomplete fees", async () => {
  const { get } = setup(params => {
    const route = lifiFixture(params);
    if (params.toTokenAddress === aaplxEth) route.toToken.decimals = 17;
    if (params.toTokenAddress === tokenRegistry.AAPLon.solanaMainnet.mint.address) route.fromAmount = "1";
    if (params.toTokenAddress === aaplonBnb) route.steps[0].action.toChainId = 1;
    if (params.toTokenAddress === tokenRegistry.AAPLx.solanaMainnet.mint.address) {
      route.steps[0].estimate.feeCosts[0].amount = "13.4";
    }
    return route;
  });
  const preview = await get(amount);
  const [solX, ethX, solOndo, , bnbOndo] = preview.offers;
  assert.equal(solX.status, "quoted");
  assert.equal(solX.costData, "partial");
  assert.equal(solX.feeCosts.length, 0);
  for (const offer of [ethX, solOndo, bnbOndo]) {
    assert.equal(offer.status, "unavailable");
    assert.equal(offer.code, "UPSTREAM_ERROR");
  }
});

test("binds AI explanations to current quotes from distinct destination chains", async () => {
  const preview = await setup().get(amount);
  const data: AppleQuotesResponse = {
    cluster: "solana-mainnet", mode: "quote-only", source: "LI.FI",
    input: { symbol: "IDRX", mint: idrx, decimals: 2, amountAtomic: amount }, quotes: [],
    selection: { candidates: [], decision: { status: "unavailable", reason: "NO_FRESH_ROUTES" } },
    multichain: {
      ...preview, offers: preview.offers.map(offer => offer.status === "quoted"
        ? { ...offer, expiresAt: new Date(Date.now() + 60_000).toISOString() }
        : offer),
    },
  };
  const evidence = analysisEvidence(data, Date.now());
  assert.equal(evidence.multichain.length, 5);
  assert.ok(evidence.multichain.every(route => route.priceImpact === "unknown" && route.productionEligibility === "UNKNOWN"));
  assert.ok(evidence.multichain.some(route => route.type === "cross-chain"));
  const response = (evidence: string[]): typeof fetch => async () => Response.json({
    status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify({
      points: [{ text: "Ethereum dan Solana memiliki sumber dana dan biaya yang perlu diperiksa.", evidence }],
    }) }] }],
  });
  const solQuote = "multi:AAPLx:Solana";
  const ethQuote = "multi:AAPLon:Ethereum";
  assert.equal((await explainIssuers(data, "unused", "fixture", response([solQuote]))).status, "INVALID_MODEL_OUTPUT");
  assert.equal((await explainIssuers(data, "unused", "fixture", response([solQuote, ethQuote]))).status, "OK");
  assert.equal(analysisEvidence(data, Date.now() + 61_000).multichain.length, 0);
});
